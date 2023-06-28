import Button from "../components/Button";
import axios from "axios";
const PrimaryButton = Button("primary");

export default function Test() {
  const instance = axios.create({
    baseURL: "http://140.112.106.82:8000",
  });
  const test = async () => {
    try {
      const data = await instance.post("/login", {
        email: "a0909182197@gmail.com",
        password: "cl910322",
      });
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  };
  const test1 = async () => {
    await instance.delete("/favorite", {
      data: { fileId: "1" },
    });
  };

  return <PrimaryButton onClick={test}>Test</PrimaryButton>;
}
