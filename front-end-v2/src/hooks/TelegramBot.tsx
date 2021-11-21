import { useFetchWithToken } from "./FetchWithToken";

function useTelegramBotToken() {
  const fetch = useFetchWithToken();
  const localToken = JSON.parse(
    localStorage.getItem("telegram_bot_token") || "null"
  );
  if (localToken)
    if (localToken.token) {
      return localToken;
    }
  fetch("/secrets/telegram-bot-token/").then((res) =>
    res.json().then((data) => {
      if (res.status === 200) {
        localStorage.setItem("telegram_bot_token", JSON.stringify(data));
        return data;
      }
      console.error(data);
    })
  );
  return { token: null, channel: null };
}

export function useTelegramDebugMessage() {
  const { token, channel } = useTelegramBotToken();

  async function sendMessage(message: string) {
    const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${channel}&text=${message}`;
    fetch(url).catch((err) => console.log(err));
  }

  return sendMessage;
}
