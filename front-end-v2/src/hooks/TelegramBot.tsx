import { useFetchWithToken } from "./FetchWithToken";

export function useTelegramDebugMessage() {

  function useTelegramBotToken() {
    const fetch = useFetchWithToken();
    const localToken = JSON.parse(
      localStorage.getItem("telegram_bot_token") as string
    );
    if (localToken) {
      return localToken;
    }
    fetch("/secrets/telegram-bot-token/").then((res) =>
      res.json().then((data) => {
        localStorage.setItem("telegram_bot_token", JSON.stringify(data));
        return data;
      })
    );
  }

  const { token, channel } = useTelegramBotToken();

  async function sendMessage(message: string) {
    const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${channel}&text=${message}`;
    fetch(url).catch((err) => console.log(err));
  }
  return sendMessage;
}
