import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "./label";

const meta: Meta<typeof Label> = {
  title: "Components/UI/Label",
  component: Label,
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: "text",
      description: "The text content of the label",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    children: "Form Label",
  },
};

export const Required: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Label htmlFor="email">Email Address</Label>
      <span className="text-destructive">*</span>
    </div>
  ),
};