import * as Yup from "yup";
import { PASSWORD_LENGTH_MESSAGE, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../contants/AccountConstants";

export const emailField = Yup.string()
    .email("Enter a valid email address.")
    .required("Enter your email address.");

export const newPasswordField = Yup.string()
    .min(PASSWORD_MIN_LENGTH, PASSWORD_LENGTH_MESSAGE)
    .max(PASSWORD_MAX_LENGTH, PASSWORD_LENGTH_MESSAGE)
    .required("Choose a password.");
