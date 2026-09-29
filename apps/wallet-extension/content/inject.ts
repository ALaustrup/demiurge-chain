// Demiurge Wallet Extension - Content Script
// Bridges between web page and background service worker

// Inject the provider script into the page
function injectProvider(): void {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('content/provider.js');
  script.type = 'module';
  script.onload = () => script.remove();
  
  // Inject as early as possible
  const container = document.head || document.documentElement;
  container.insertBefore(script, container.firstChild);
}

// Map RPC method names to internal message types
function mapMethodToMessage(method: string): { type: string; needsApproval: boolean } {
  switch (method) {
    case 'demiurge_requestAccounts':
      return { type: 'DAPP_CONNECT', needsApproval: true };
    case 'demiurge_accounts':
      return { type: 'DAPP_GET_ACCOUNTS', needsApproval: false };
    case 'demiurge_disconnect':
      return { type: 'DAPP_DISCONNECT', needsApproval: false };
    case 'demiurge_getBalance':
      return { type: 'GET_BALANCE', needsApproval: false };
    case 'demiurge_signMessage':
      return { type: 'SIGN_MESSAGE', needsApproval: true };
    case 'demiurge_signTransaction':
      return { type: 'SIGN_TRANSACTION', needsApproval: true };
    case 'demiurge_sendTransaction':
      return { type: 'SEND_TRANSACTION', needsApproval: true };
    case 'demiurge_chainId':
      return { type: 'NETWORK_GET_CURRENT', needsApproval: false };
    case 'demiurge_network':
      return { type: 'NETWORK_GET_CURRENT', needsApproval: false };
    default:
      return { type: 'UNKNOWN', needsApproval: false };
  }
}

// Forward message from page to background
async function forwardToBackground(
  method: string,
  params: any[],
  requestId: number
): Promise<void> {
  const { type, needsApproval } = mapMethodToMessage(method);
  
  if (type === 'UNKNOWN') {
    sendResponseToPage(requestId, null, { code: -32601, message: 'Method not found' });
    return;
  }

  // Build payload based on method
  let payload: any = {};
  
  switch (method) {
    case 'demiurge_getBalance':
      payload = { address: params[0] };
      break;
    case 'demiurge_signMessage':
      payload = { message: params[0], account: params[1] };
      break;
    case 'demiurge_signTransaction':
    case 'demiurge_sendTransaction':
      payload = { transaction: params[0] };
      break;
    default:
      payload = params[0] || {};
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type,
      payload,
      origin: window.location.origin,
      requestId: requestId.toString(),
    });

    if (response.success) {
      // Transform response based on method
      let result = response.data;
      
      switch (method) {
        case 'demiurge_requestAccounts':
        case 'demiurge_accounts':
          result = response.data?.accounts || [];
          break;
        case 'demiurge_chainId':
          result = response.data?.network || 'demiurge-mainnet';
          break;
        case 'demiurge_network':
          result = { chainId: response.data?.network, name: response.data?.network };
          break;
        case 'demiurge_getBalance':
          result = response.data?.balance || '0';
          break;
        case 'demiurge_signMessage':
          result = response.data?.signature;
          break;
        case 'demiurge_signTransaction':
          result = response.data;
          break;
        case 'demiurge_sendTransaction':
          result = response.data?.hash;
          break;
      }
      
      sendResponseToPage(requestId, result, null);
    } else {
      sendResponseToPage(requestId, null, { 
        code: -32603, 
        message: response.error || 'Internal error' 
      });
    }
  } catch (error) {
    sendResponseToPage(requestId, null, { 
      code: -32603, 
      message: (error as Error).message 
    });
  }
}

// Send response back to page
function sendResponseToPage(
  requestId: number,
  result: any,
  error: { code: number; message: string } | null
): void {
  window.postMessage({
    type: 'DEMIURGE_RESPONSE',
    requestId,
    payload: error ? { error } : { result },
  }, '*');
}

// Send event to page
function sendEventToPage(event: string, data: any): void {
  window.postMessage({
    type: 'DEMIURGE_EVENT',
    payload: { event, data },
  }, '*');
}

// Listen for messages from page
window.addEventListener('message', async (event) => {
  // Only accept messages from same window
  if (event.source !== window) return;
  
  const { type, requestId, payload } = event.data;
  
  if (type === 'DEMIURGE_REQUEST') {
    const { method, params } = payload;
    await forwardToBackground(method, params, requestId);
  }
});

// Extract page context for Sophia AI
function getPageContext(): { url: string; title: string; selectedText: string; content: string } {
  const selection = window.getSelection();
  return {
    url: window.location.href,
    title: document.title,
    selectedText: selection ? selection.toString().trim() : '',
    content: document.body?.innerText?.slice(0, 10000) || '',
  };
}

// Listen for events from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'WALLET_EVENT') {
    sendEventToPage(message.event, message.data);
  } else if (message.type === 'GET_PAGE_CONTEXT') {
    sendResponse({ success: true, data: getPageContext() });
    return;
  }
  sendResponse({ received: true });
  return true;
});

// Inject provider immediately
injectProvider();

console.log('Demiurge Wallet: Content script loaded');
