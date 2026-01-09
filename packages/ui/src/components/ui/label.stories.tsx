import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "./label";
import { Input } from "./input";

const meta: Meta<typeof Label> = {
  title: "UI/Label",
  component: Label,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Label htmlFor="email">Email Address</Label>
      <Input type="email" id="email" placeholder="Email" className="w-[200px]" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Label htmlFor="disabled-input" className="peer-disabled:opacity-70">
        Disabled Field
      </Label>
      <Input disabled id="disabled-input" placeholder="Can't touch this" className="w-[200px] peer" />
    </div>
  ),
};