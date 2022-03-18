import React, { useEffect, useState } from "react";
import {useRouter} from 'next/router'

const Login = () => {
  const [input, setInput] = useState("");
  const [code, setCode] = useState<string | null>(null)
  const router = useRouter()

  const submitHandler = (e: React.SyntheticEvent) => {
    e.preventDefault();
    console.log(input)
    sessionStorage.setItem("code", input);
    document.cookie = `code=${input}`
    router.push({pathname: '/'})
  };

  return (
    <div>
      <form onSubmit={submitHandler} className='flex flex-col'>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          type="password"
          placeholder="code"
          required
          className="py-2 px-2 bg-slate-200"
          
        />
        <button type="submit" className="bg-black text-white py-3 ">login</button>
      </form>
    </div>
  );
};
export default Login;
