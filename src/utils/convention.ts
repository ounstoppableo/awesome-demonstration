export default function isDivScrolledToBottom(element: any) {
  return element.scrollHeight - element.scrollTop <= element.clientHeight;
}
