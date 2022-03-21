import React, { useEffect } from "react";
import logo from "images/logo.png";
import toast from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useCookies } from "react-cookie";
import * as yup from "yup";
import { useLoginMutation } from "services/api";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { saveAuth, saveCredentials } from "features";
import {
  Input,
  Label,
  Loader,
  Button,
  CheckBox,
  Container,
  FormGroup,
  ErrorMessage,
  PasswordInput,
} from "components";

const schema = yup.object({
  email: yup.string().email().required("please enter your email"),
  password: yup.string().min(8).required("please enter your password"),
  rememberMe: yup.bool(),
});

const LogIn = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });
  const cookieName = "SWOB-DEV-FE";
  const [cookies, setCookie] = useCookies([cookieName]);
  const [login, { isLoading, isSuccess }] = useLoginMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const session = cookies[cookieName];
    // if logged in then redirect to dashboard
    if (session && location.state && location.state.path) {
      /*
        redirect users if they initially tried to access a private route
        without permission
      */
      navigate(location.state.path);
    } else if (session) {
      navigate("/dashboard");
    }
  }, [navigate, cookies, location.state]);

  const handleLogin = async (data) => {
    try {
      const user = await login(data).unwrap();
      toast.success("Login successful");
      // create a cookie for this session
      setCookie("SWOB-DEV-FE", user.session_id, {
        maxAge: 2 * 60 * 60 * 1000,
      });
      dispatch(saveAuth(user));
      dispatch(saveCredentials(user));
      // if user wants to be remembered then cache their session
      // TODO: handle remember me
    } catch (error) {
      switch (error.status) {
        case 400:
          toast.error("An error occured. Please contact support");
          break;
        case 401:
          toast.error(
            "Sorry you are not authorized to use this service. Please contact support"
          );
          break;
        case 409:
          toast.error(
            "There is a possible duplicate of this account please contact support"
          );
          break;

        case 429:
          toast.error(
            "Too many failed attempts please wait a while and try again"
          );
          break;
        case 500:
          toast.error("A critical error occured. Please contact support");
          break;
        case "FETCH_ERROR":
          toast.error(
            "An error occured, please check your network and try again"
          );
          break;
        default:
          toast.error("An error occured, please try again");
      }
    }
  };

  /*
    when making requests show loading indicator
    Also maintain after request is successfull to update background state
  */
  if (isLoading || isSuccess) {
    return <Loader message="processing please wait ..." />;
  }

  return (
    <Container className="bg-gray-100 md:py-20 2xl:py-0 xl:min-h-screen lg:grid lg:place-items-center">
      <div className="container max-w-md p-8 mx-auto bg-white shadow-lg md:rounded-xl lg:my-10">
        <div className="mb-8">
          <img src={logo} alt="logo" className="h-32 mx-auto my-6" />
          <h1 className="text-2xl font-bold text-center">SMSWithoutBorders</h1>
          <p className="my-1 text-2xl font-light tracking-wide text-center">
            Developer
          </p>
        </div>
        <form onSubmit={handleSubmit(handleLogin)}>
          <FormGroup>
            <Label htmlFor="email" required>
              Email address
            </Label>
            <Input
              type="email"
              name="email"
              {...register("email")}
              error={errors.email}
            />
            {errors.email && (
              <ErrorMessage>{errors.email?.message}</ErrorMessage>
            )}
          </FormGroup>
          <FormGroup>
            <Label htmlFor="password" required>
              Password
            </Label>
            <PasswordInput
              name="password"
              showStrength={false}
              {...register("password")}
              error={errors.password}
            />
            {errors.password && (
              <ErrorMessage>{errors.password?.message}</ErrorMessage>
            )}
          </FormGroup>

          <FormGroup>
            <Controller
              control={control}
              name="rememberMe"
              render={({ field: { value, onChange } }) => (
                <Label className="inline-flex items-center">
                  <CheckBox value={value} onChange={onChange} />
                  <span className="ml-2">remember me</span>
                </Label>
              )}
            />
          </FormGroup>
          <Button className="w-full">login</Button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-600">
          Dont have an account? &nbsp;
          <Link to="/signup" className="text-blue-800">
            Sign Up
          </Link>
        </p>
      </div>
    </Container>
  );
};

export default LogIn;
