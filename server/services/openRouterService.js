import { searchProducts, getProductDetails } from './aiToolsService.js';

const SYSTEM_PROMPT = `
You are ShopAI, a premium AI shopping assistant for this e-commerce store.
RULES:
1. You may recommend ONLY products returned by the store's product tools.
2. Never invent products, prices, stock, or product IDs.
3. For product information, use the store database as the source of truth.
4. If a user asks to add an item to the cart, use the triggerAddToCart tool.
5. If a user asks to buy or checkout, use the triggerCheckout tool.
6. When you search for products and find them, summarize them naturally in your response. The system will automatically render product cards for any products you queried during this turn.
7. If no matching products exist, clearly tell the user that no matching products were found.
8. Do not recommend Amazon, Flipkart, or external stores.
9. For Gift Finding or Budget Shopping, use searchProducts to filter by budget (maxPrice), category, or intent.
`;

const tools = [
  {
    type: "function",
    function: {
      "name": "searchProducts",
      "description": "Search the MongoDB database for products matching the user's intent.",
      "parameters": {
        "type": "object",
        "properties": {
          "query": { "type": "string", "description": "Search keywords like 'shirt', 'watch'" },
          "category": { "type": "string" },
          "minPrice": { "type": "number" },
          "maxPrice": { "type": "number" },
          "gender": { "type": "string", "description": "e.g. Men, Women, Kids" },
          "color": { "type": "string" },
          "brand": { "type": "string" },
          "rating": { "type": "number", "description": "Minimum rating (1-5)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      "name": "getProductDetails",
      "description": "Get detailed information about a specific product by its ID.",
      "parameters": {
        "type": "object",
        "properties": {
          "productId": { "type": "string" }
        },
        "required": ["productId"]
      }
    }
  },
  {
    type: "function",
    function: {
      "name": "triggerAddToCart",
      "description": "Add a specific product to the user's cart.",
      "parameters": {
        "type": "object",
        "properties": {
          "productId": { "type": "string", "description": "The valid MongoDB ObjectId of the product" }
        },
        "required": ["productId"]
      }
    }
  },
  {
    type: "function",
    function: {
      "name": "triggerCheckout",
      "description": "Initiate the checkout process.",
      "parameters": {
        "type": "object",
        "properties": {}
      }
    }
  }
];

export const processAIChat = async (messages) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  // Ensure system prompt is the first message
  let conversation = [...messages];
  if (conversation.length === 0 || conversation[0].role !== 'system') {
    conversation.unshift({ role: 'system', content: SYSTEM_PROMPT });
  }

  let finalProducts = [];
  let actionIntent = null;
  let iterations = 0;
  const maxIterations = 3;

  while (iterations < maxIterations) {
    iterations++;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini', // or another reliable model
        messages: conversation,
        tools: tools,
        tool_choice: 'auto'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error:', errorText);
      throw new Error('Failed to communicate with AI provider.');
    }

    const data = await response.json();
    const responseMessage = data.choices[0].message;

    // Append AI response to conversation
    conversation.push(responseMessage);

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      // Handle tool calls
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments || '{}');

        let toolResult = null;

        if (functionName === 'searchProducts') {
          const products = await searchProducts(functionArgs);
          toolResult = products;
          // Collect products to send to frontend
          if (Array.isArray(products)) {
            finalProducts = [...finalProducts, ...products];
          }
        } else if (functionName === 'getProductDetails') {
          const product = await getProductDetails(functionArgs);
          toolResult = product;
          if (!product.error) {
            finalProducts.push(product);
          }
        } else if (functionName === 'triggerAddToCart') {
          // Instead of actually adding, we set an action intent and return immediately
          actionIntent = { type: 'ADD_TO_CART', productId: functionArgs.productId };
          toolResult = { success: true, message: 'Action queued for client.' };
        } else if (functionName === 'triggerCheckout') {
          actionIntent = { type: 'CHECKOUT' };
          toolResult = { success: true, message: 'Action queued for client.' };
        }

        // Add tool result to conversation
        conversation.push({
          role: 'tool',
          name: functionName,
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult)
        });
      }

      // If an action intent was triggered, we can stop iterating and return
      // But we should let the AI generate a final text response first.
      // So we just continue the loop.
    } else {
      // No tool calls, final response generated
      break;
    }
  }

  const finalMessage = conversation[conversation.length - 1];

  // Deduplicate products
  const uniqueProducts = Array.from(new Map(finalProducts.map(p => [p._id, p])).values());

  return {
    reply: finalMessage.content || '',
    products: uniqueProducts,
    actionIntent,
    conversation // returning the updated conversation history
  };
};
