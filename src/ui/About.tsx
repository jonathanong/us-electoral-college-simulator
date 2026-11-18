export const REPO_URL = "https://github.com/jonathanong/us-electoral-college-simulator";

export const REFERENCES: readonly { href: string; title: string; note: string }[] = [
  {
    href: "https://en.wikipedia.org/wiki/Reapportionment_Act_of_1929",
    title: "Reapportionment Act of 1929",
    note: "The law that froze the House at 435 seats.",
  },
  {
    href: "https://www.census.gov/data/tables/time-series/dec/apportionment-data-text.html",
    title: "U.S. Census Bureau: historical apportionment data",
    note: "Populations and seats, 1910–2020.",
  },
  {
    href: "https://www.archives.gov/electoral-college/results",
    title: "National Archives: Electoral College results",
    note: "Official electoral votes by state.",
  },
  {
    href: "https://thearp.org/blog/the-cube-root-rule/",
    title: "American Redistricting Project: The cube root rule",
    note: "A cube-root House for 2024.",
  },
  {
    href: "https://thearp.org/blog/the-wyoming-rule/",
    title: "American Redistricting Project: The Wyoming rule",
    note: "District size set by the smallest state.",
  },
  {
    href: "https://www.amacad.org/ourcommonpurpose/enlarging-House-representatives",
    title: "American Academy of Arts & Sciences: Enlarging the House",
    note: "The case for a larger House, with Electoral College simulations.",
  },
  {
    href: "https://fairvote.org/how_we_can_change_the_size_of_the_house_of_representatives/",
    title: "FairVote: Why 435?",
    note: "How the House size could change.",
  },
  {
    href: "https://protectdemocracy.org/work/expanding-the-house-of-representatives-explained/",
    title: "Protect Democracy: Expanding the House, explained",
    note: "Background and proposals.",
  },
  {
    href: "https://blogs.lse.ac.uk/usappblog/2014/11/27/even-without-senate-electoral-votes-the-size-of-the-u-s-house-of-representatives-could-still-determine-the-outcome-of-presidential-elections",
    title: "Nicholas R. Miller (LSE USAPP): House size and presidential outcomes",
    note: "The academic “House size effect”, including 2000.",
  },
  {
    href: "https://en.wikipedia.org/wiki/Twenty-third_Amendment_to_the_United_States_Constitution",
    title: "23rd Amendment",
    note: "DC's electors: as many as if it were a state, but no more than the smallest state.",
  },
];

export function AboutPage() {
  return (
    <article class="prose">
      <div class="page-head">
        <h1>How it works</h1>
        <p class="lead">
          Each state gets one elector per House seat plus two for its senators, so the size of the
          House and the way states award electors both shape who wins.
        </p>
      </div>
      <h2>Assumptions</h2>
      <ul>
        <li>
          Votes are held fixed: everyone votes exactly as they did. Real campaigns would adapt.
        </li>
        <li>
          Counterfactual Houses are reapportioned after every census, including 1920 (which was
          skipped in reality), using the selected method. Huntington–Hill has been the law only
          since 1941.
        </li>
        <li>
          Maine and Nebraska: two electors go to the statewide winner, and district electors are
          scaled from the real district split. This is an estimate, since more districts would be
          drawn differently.
        </li>
        <li>
          Faithless electors are returned to the candidate they were pledged to. Historically split
          delegations (e.g. California 1912, Alabama 1960) are scaled proportionally, or given to
          the popular-vote winner if you choose that option.
        </li>
        <li>
          Popular votes cover every candidate with at least 1% nationally. Everyone else in a state
          is grouped as “Others”, from the state's total vote, and can win proportional electors
          (for example Utah 2016, where McMullin took 21%).
        </li>
        <li>
          Ranked choice: each eliminated candidate's voters are split between the two national
          front-runners by the sliders. Front-runners' own voters, and votes meant for someone
          already out, split evenly among those left.
        </li>
        <li>
          DC (from 1964) gets as many electors as it would as a state, capped at the smallest state.
        </li>
        <li>
          If nobody wins a majority, the House would choose, with one vote per state delegation. The
          site doesn't simulate that vote.
        </li>
      </ul>
      <h2>References</h2>
      <ul class="refs">
        {REFERENCES.map((r) => (
          <li key={r.href}>
            <a href={r.href} rel="noopener">
              {r.title}
            </a>{" "}
            {r.note}
          </li>
        ))}
      </ul>
      <p>
        Data sources and licenses are listed in{" "}
        <a href={`${REPO_URL}/blob/main/data/SOURCES.md`}>data/SOURCES.md</a>. The code is MIT
        licensed and open source on <a href={REPO_URL}>GitHub</a>.
      </p>
    </article>
  );
}
