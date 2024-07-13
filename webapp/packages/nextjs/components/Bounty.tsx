import { Button } from "./ui/Button";

type BountyProps = {
  title: string;
  description: string;
  amount: string;
  imgSrc: string;
};

export const Bounty = ({ title, description, amount, imgSrc }: BountyProps) => (
  <div className="bg-background rounded-lg shadow-lg overflow-hidden">
    <div className="relative">
      <img src={imgSrc} alt={title} width={500} height={300} className="w-full h-48 object-cover" />
      <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium">
        {amount}
      </div>
    </div>
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-4">{description}</p>
      <Button className="w-full">Apply Now</Button>
    </div>
  </div>
);
