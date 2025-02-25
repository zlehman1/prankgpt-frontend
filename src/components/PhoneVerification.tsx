import {
  Box,
  Center,
  Container,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/layout";
import { PinInput, PinInputField, Button } from "@chakra-ui/react";
import React from "react";
import { SessionContext } from "../helpers/SessionContext";
import { supabase } from "../services/supabase";
import {
  isCallerIdVerified,
  sendCallerIdValidation,
  VerificationType,
} from "../helpers/verification";
import ErrorPage from "./ErrorPage";

const PhoneVerification = ({
  phoneNumber,
  verificationType,
  setShowVerificationScreen,
  captchaToken,
  captchaRef,
}: {
  phoneNumber: string;
  verificationType: VerificationType;
  setShowVerificationScreen: (showVerificationScreen: boolean) => void;
  captchaToken: string;
  captchaRef: React.RefObject<any>;
}) => {
  const [verificationCode, setVerificationCode] = React.useState("");
  const [isCallerIdVerification, setIsCallerIdVerification] =
    React.useState(false);
  const [isNormalVerification, setIsNormalVerification] = React.useState(false);

  const signInWithOtp = (phoneNumber: string) => {
    supabase.auth
      .signInWithOtp({
        phone: phoneNumber,
        options: {
          captchaToken,
        },
      })
      .then(({ data, error }) => {
        if (error) {
          alert(error.message);
          setShowVerificationScreen(false);
        } else {
          setIsNormalVerification(true);
        }
        // @ts-ignore
        captchaRef.current?.resetCaptcha();
      });
  };

  React.useEffect(() => {
    const waitForCallerIdVerified = async (phoneNumber: string) => {
      let callerIdVerified = false;
      while (!callerIdVerified) {
        callerIdVerified = await isCallerIdVerified(phoneNumber);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
      setShowVerificationScreen(false);
    };

    if (verificationType === "callerId") {
      sendCallerIdValidation(phoneNumber).then((code) => {
        setIsCallerIdVerification(true);
        setVerificationCode(code);
        waitForCallerIdVerified(phoneNumber);
      });
    } else {
      signInWithOtp(phoneNumber);
    }
  }, []);

  if (!phoneNumber) return <ErrorPage />;

  const pinInputStyles = {
    textAlign: "center" as const,
    height: "60px",
    width: "40px",
    marginRight: "4px",
    fontSize: "30px",
  };

  const isReadOnly = isCallerIdVerification;

  const onFormSubmit = (event: any) => {
    event.preventDefault();
    onSubmit();
  };

  const onSubmit = async () => {
    await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token: verificationCode,
      type: "sms",
    });
  };

  return (
    <div className="code">
      <Container flex="1">
        <Center>
          <form onSubmit={onFormSubmit}>
            <VStack>
              {isCallerIdVerification && (
                <Text>
                  We are setting up your phone's caller ID in our system. You'll
                  receive a call. When prompted, please enter the number
                  displayed below.
                </Text>
              )}
              {isNormalVerification && (
                <Text>Enter the code we've just texted you.</Text>
              )}
              <HStack>
                <PinInput
                  value={verificationCode}
                  onChange={setVerificationCode}
                  isDisabled={isReadOnly}
                  otp
                  size="lg"
                >
                  <PinInputField style={pinInputStyles} />
                  <PinInputField style={pinInputStyles} />
                  <PinInputField style={pinInputStyles} />
                  <PinInputField style={pinInputStyles} />
                  <PinInputField style={pinInputStyles} />
                  <PinInputField style={pinInputStyles} />
                </PinInput>
              </HStack>
              {isNormalVerification && <Button type="submit">Submit</Button>}
            </VStack>
          </form>
        </Center>
      </Container>
    </div>
  );
};

export default PhoneVerification;
