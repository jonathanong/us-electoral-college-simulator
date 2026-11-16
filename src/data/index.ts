import apportionmentPopulation from "../../data/csv/apportionment-population.csv?raw";
import candidates from "../../data/csv/candidates.csv?raw";
import censusApportionment from "../../data/csv/census-apportionment.csv?raw";
import electoralVotes from "../../data/csv/electoral-votes.csv?raw";
import faithless from "../../data/csv/faithless.csv?raw";
import popularVotes from "../../data/csv/popular-votes.csv?raw";
import { buildDataset } from "./load.ts";

export const files = {
  censusApportionment,
  apportionmentPopulation,
  candidates,
  electoralVotes,
  faithless,
  popularVotes,
};

export const dataset = buildDataset(files);
