import {
  getInventory,
  getLowStockProducts,
  searchAdminProducts,
  getAdminOrders,
  getAdminOrderById,
  getSalesSummary,
  updateProductField,
  updateOrderStatusTool
} from './adminAiToolsService.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';

const ADMIN_SYSTEM_PROMPT = `
You are the internal AI assistant for the administrator of this e-commerce platform.
You may access only tools explicitly provided by the backend.
Use actual database data.
Never invent products, stock, orders, prices, revenue, or analytics.
You are allowed to read admin data only when the authenticated user has administrator privileges.

For write operations such as changing product data, changing stock, changing price, or changing order status:
1. You MUST use the 'proposeUpdateProduct' or 'proposeUpdateOrderStatus' tools.
2. Identify the exact target.
   - If the user refers to an item by position (e.g., 'the 3rd order', 'the second product'), find the MOST RECENT list tool response and resolve that position to the actual database '_id' or 'orderId'.
   - Never use a positional number (like '3') as an orderId or productId.
   - If the user explicitly provides an order ID like '103', use that exact number.
   - If the reference is ambiguous or missing from the recent context, ask the user to clarify.
3. Show the current value.
4. Show the requested new value.
5. Ask for explicit confirmation.
6. The system will handle the execution after user confirmation.
6. The system will handle the execution after user confirmation.

Never delete data unless a dedicated tool explicitly allows it.
Never expose passwords or secrets.
Never bypass backend authorization.
`;

const tools = [
  {
    type: "function",
    function: {
      name: "getInventory",
      description: "Get general inventory statistics and a list of products.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "getLowStockProducts",
      description: "Get products with stock less than or equal to a threshold.",
      parameters: {
        type: "object",
        properties: {
          threshold: { type: "number", description: "Stock threshold, default 5" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "searchAdminProducts",
      description: "Search products in the database by name or category for admin view.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          category: { type: "string" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getAdminOrders",
      description: "Get recent orders, optionally filtered by status.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "e.g., Pending, Confirmed, Shipped" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getAdminOrderById",
      description: "Get details of a specific order.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string" }
        },
        required: ["orderId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getSalesSummary",
      description: "Get today's sales and order count.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "proposeUpdateProduct",
      description: "Propose an update to a product's price, stock, or status. This will ask the user for confirmation.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string" },
          field: { type: "string", enum: ["price", "stock", "isActive"] },
          newValue: { type: "string", description: "The new value for the field" }
        },
        required: ["productId", "field", "newValue"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "proposeUpdateOrderStatus",
      description: "Propose an update to an order's status. This will ask the user for confirmation.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string" },
          newStatus: { type: "string", enum: ["Pending", "Confirmed", "Processing", "Packed", "Shipped", "Delivered", "Cancelled"] }
        },
        required: ["orderId", "newStatus"]
      }
    }
  }
];

export const processAdminAIChat = async (messages, confirmedAction = null, adminId) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  let conversation = [...messages];
  if (conversation.length === 0 || conversation[0].role !== 'system') {
    conversation.unshift({ role: 'system', content: ADMIN_SYSTEM_PROMPT });
  }

  let actionIntent = null;

  // Handle pre-confirmed action execution before calling AI
  if (confirmedAction) {
    let executionResult = '';
    if (confirmedAction.tool === 'updateProductField') {
      const result = await updateProductField({ ...confirmedAction.args, adminId });
      executionResult = result.error ? `Error: ${result.error}` : result.message;
    } else if (confirmedAction.tool === 'updateOrderStatusTool') {
      const result = await updateOrderStatusTool({ ...confirmedAction.args, adminId });
      executionResult = result.error ? `Error: ${result.error}` : result.message;
    }

    conversation.push({
      role: 'system',
      content: `The user confirmed the action. Execution result: ${executionResult}. Please summarize this to the user.`
    });
  }

  let iterations = 0;
  const maxIterations = 5;

  while (iterations < maxIterations) {
    iterations++;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
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

    conversation.push(responseMessage);

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments || '{}');
        let toolResult = null;

        if (functionName === 'getInventory') {
          toolResult = await getInventory();
        } else if (functionName === 'getLowStockProducts') {
          toolResult = await getLowStockProducts(functionArgs);
        } else if (functionName === 'searchAdminProducts') {
          toolResult = await searchAdminProducts(functionArgs);
        } else if (functionName === 'getAdminOrders') {
          toolResult = await getAdminOrders(functionArgs);
        } else if (functionName === 'getAdminOrderById') {
          toolResult = await getAdminOrderById(functionArgs);
        } else if (functionName === 'getSalesSummary') {
          toolResult = await getSalesSummary();
        } else if (functionName === 'proposeUpdateProduct') {
          try {
            const product = await Product.findById(functionArgs.productId);
            if (!product) {
              toolResult = { error: 'Product not found.' };
            } else {
              actionIntent = {
                type: 'CONFIRM_UPDATE',
                tool: 'updateProductField',
                args: {
                  productId: functionArgs.productId,
                  field: functionArgs.field,
                  value: functionArgs.newValue
                },
                message: `You are about to change the ${functionArgs.field} of "${product.name}" from ${product[functionArgs.field]} to ${functionArgs.newValue}.`
              };
              toolResult = { 
                success: true, 
                currentValue: product[functionArgs.field],
                productName: product.name,
                instructionToAI: "Ask the user to confirm this change explicitly." 
              };
            }
          } catch (e) {
            toolResult = { error: 'Invalid product ID' };
          }
        } else if (functionName === 'proposeUpdateOrderStatus') {
          try {
            let dbQuery = {};
            if (mongoose.Types.ObjectId.isValid(functionArgs.orderId)) {
              dbQuery = { $or: [{ _id: functionArgs.orderId }, { orderId: Number(functionArgs.orderId) || -1 }] };
            } else {
              dbQuery = { orderId: Number(functionArgs.orderId) };
            }

            const order = await Order.findOne(dbQuery).populate('user', 'name');
            if (!order) {
              toolResult = { error: 'Order not found.' };
            } else {
              actionIntent = {
                type: 'CONFIRM_UPDATE',
                tool: 'updateOrderStatusTool',
                args: {
                  orderId: order._id.toString(), // Always use actual MongoDB ID for backend tool
                  status: functionArgs.newStatus
                },
                message: `Order #${order.orderId || order._id.toString().substring(0,8)} (Customer: ${order.user ? order.user.name : 'Guest'}, Total: $${order.total.toFixed(2)}). You are about to change its status from ${order.orderStatus} to ${functionArgs.newStatus}.`
              };
              toolResult = {
                success: true,
                currentStatus: order.orderStatus,
                instructionToAI: "Ask the user to confirm this status change explicitly."
              };
            }
          } catch (e) {
            toolResult = { error: 'Invalid order ID' };
          }
        }

        conversation.push({
          role: 'tool',
          name: functionName,
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult)
        });
      }
    } else {
      break;
    }
  }

  let finalMessage = conversation[conversation.length - 1];

  // If the loop exited but the last message is a tool response, force a final summary
  if (finalMessage.role === 'tool') {
    try {
      const fallbackResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: conversation
        })
      });
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        finalMessage = fallbackData.choices[0].message;
        conversation.push(finalMessage);
      }
    } catch (err) {
      console.error('Fallback AI request failed', err);
    }
  }

  return {
    reply: finalMessage.content || '',
    actionIntent,
    conversation
  };
};
