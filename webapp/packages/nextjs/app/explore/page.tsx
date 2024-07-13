import { Bounty } from "../../components/Bounty";

export default function Page() {
  return (
    <section className="container mx-auto py-12 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8">Bounty Board</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        <Bounty
          title="Wanted: Notorious Outlaw"
          description="Capture the infamous outlaw known as 'The Bandit' and bring them to justice."
          amount="$5,000"
          imgSrc="/placeholder.svg"
        />
        <Bounty
          title="Wanted: Elusive Hacker"
          description="Capture the skilled hacker responsible for a series of high-profile cyber attacks."
          amount="$10,000"
          imgSrc="/placeholder.svg"
        />
        <Bounty
          title="Wanted: Elusive Art Thief"
          description="Capture the notorious art thief who has been evading authorities for years."
          amount="$15,000"
          imgSrc="/placeholder.svg"
        />
        <Bounty
          title="Wanted: Notorious Crime Boss"
          description="Capture the elusive crime boss who has been terrorizing the city for years."
          amount="$20,000"
          imgSrc="/placeholder.svg"
        />
      </div>
    </section>
  );
}
