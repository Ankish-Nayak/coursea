import axios from "axios";
import {  useState } from "react";
import { BASE_URL } from "../.config";
import { userParams } from "types";
import { useSetRecoilState } from "recoil";
import { userState } from "../store/atoms/user";
import { useNavigate } from "react-router-dom";
import { Button, Card, TextField } from "@mui/material";
export const Signin = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const setUser = useSetRecoilState(userState);
  const navigate = useNavigate();
  const handleOnClick = async () => {
    try {
      const userInput: userParams = {
        username,
        password,
      };
      const response = await axios.post(
        `${BASE_URL}/user/login`,
        JSON.stringify(userInput),
        {
          // withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = response.data;
      if (data.token) {
        setUser({
          isLoading: false,
          userEmail: username,
        });
        navigate("/courses");
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        paddingTop: 150,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Card
          variant="outlined"
          style={{
            width: 400,
            padding: 20,
          }}
        >
          <TextField
            variant="outlined"
            label="Email"
            fullWidth={true}
            onChange={(e) => {
              setUsername(e.target.value);
            }}
          />
          <br />
          <br />
          <TextField
            variant="outlined"
            label="Password"
            type="password"
            fullWidth={true}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
          <br />
          <br />
          <Button variant="contained" size={"large"} onClick={handleOnClick}>
            Login
          </Button>
        </Card>
      </div>
    </div>
  );
};
