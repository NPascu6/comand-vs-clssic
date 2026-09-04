import { Step, StepLabel, Stepper as MuiStepper } from '@mui/material';

export interface StepperProps {
  steps: string[];
  activeIndex: number;
}

/** MUI Stepper with labels under the dots. */
export function Stepper({ steps, activeIndex }: StepperProps) {
  return (
    <MuiStepper activeStep={activeIndex} alternativeLabel>
      {steps.map((step) => (
        <Step key={step}>
          <StepLabel>{step}</StepLabel>
        </Step>
      ))}
    </MuiStepper>
  );
}
