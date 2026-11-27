/* Open the chatbot with a question, from anywhere on the page
   (e.g. "Ask about this" on an offer). ChatWidget listens for it.
   An empty question only opens the chat. */

export const ASK_EVENT = 'hoi:ask'

export function askHoi(question: string) {
  window.dispatchEvent(new CustomEvent<string>(ASK_EVENT, { detail: question }))
}
