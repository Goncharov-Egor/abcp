// Мы ожидаем, что Вы исправите синтаксические ошибки, сделаете перехват возможных исключений и улучшите читаемость кода.
// А так же, напишите кастомный хук useThrottle и используете его там где это нужно.
// Желательно использование React.memo и React.useCallback там где это имеет смысл.
// Будет большим плюсом, если Вы сможете закэшировать получение случайного пользователя.
// Укажите правильные типы.
// По возможности пришлите Ваш вариант в https://codesandbox.io

import { useCallback, useMemo, useState } from "react";

const URL = "https://jsonplaceholder.typicode.com/users";
const THROTTLE_TIME = 2000;

type Company = {
  bs: string;
  catchPhrase: string;
  name: string;
};

type User = {
  id: number;
  email: string;
  name: string;
  phone: string;
  username: string;
  website: string;
  company: Company;
  address: any;
};

interface IButtonProps {
  onClick: any;
}

function Button({ onClick }: IButtonProps): JSX.Element {
  return (
    <button type="button" onClick={onClick}>
      get random user
    </button>
  );
}

interface IUserInfoProps {
  user: User;
}

function UserInfo({ user }: IUserInfoProps): JSX.Element {
  return (
    <table>
      <thead>
        <tr>
          <th>Username</th>
          <th>Phone number</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{user.name}</td>
          <td>{user.phone}</td>
        </tr>
      </tbody>
    </table>
  );
}

function throttle(
  func: (id: number) => Promise<void>,
  ms: number,
  ctx?: any
): (id: number) => void {
  let isThrottled = false;
  let savedArgs: any = null;

  function wrapper(id: number) {
    if (isThrottled) {
      savedArgs = arguments;
      return;
    }

    func.apply(ctx, [id]);

    isThrottled = true;

    setTimeout(function () {
      isThrottled = false;
      if (savedArgs) {
        wrapper.apply(ctx, savedArgs);
        savedArgs = null;
      }
    }, ms);
  }

  return wrapper;
}

function App(): JSX.Element {
  const [user, setUser] = useState<User>({} as User);
  const localCache = useMemo<Map<number, User>>(
    () => new Map<number, User>(),
    []
  );
  const [error, setError] = useState<Error | null>();

  const getUser = useCallback(
    async (userId: number) => {
      try {
        const response = await fetch(`${URL}/${userId}`);
        const fetchedUser = await response.json();
        if (!response.ok) {
          throw new Error(`faild to fetch user with ID=${userId}`);
        }
        localCache.set(userId, fetchedUser);
        setUser(fetchedUser);
        setError(null);
      } catch (e) {
        setError(e as Error);
      }
    },
    [localCache]
  );

  const callThrottle = useMemo(() => throttle(getUser, THROTTLE_TIME), [getUser]);

  const handleButtonClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.stopPropagation();

      const userId = Math.floor(Math.random() * 9) + 1;

      const cachedResponse = localCache.get(userId);
      if (cachedResponse) {
        setUser(cachedResponse);
        return;
      }
      callThrottle(userId);
    },
    [localCache, callThrottle]
  );

  return (
    <div>
      <header>Get a random user</header>
      <Button onClick={handleButtonClick} />
      <UserInfo user={user} />
      {error ? <h2>We have some troubles: {error.message}</h2> : null}
    </div>
  );
}

export default App;
