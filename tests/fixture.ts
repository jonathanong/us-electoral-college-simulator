import { buildDataset, type RawFiles } from "../src/data/load.ts";

/**
 * A toy country: Big, Mid (districted like Nebraska) and Tiny, plus DC from 1964.
 * Codes reuse real ones so the loader's name lookup works: CA = Big, NE = Mid, WY = Tiny.
 */
export const files: RawFiles = {
  censusApportionment: [
    "Name,Geography Type,Year,Resident Population,Number of Representatives",
    'California,State,1990,"6,000,000",6',
    "Nebraska,State,1990,3000000,3",
    "Wyoming,State,1990,1000000,1",
    "District of Columbia,State,1990,700000,",
    "Puerto Rico,State,1990,3000000,",
    "United States,Nation,1990,10000000,10",
    "California,State,2000,6000000,6",
    "Nebraska,State,2000,3000000,3",
    "Wyoming,State,2000,1000000,1",
    "District of Columbia,State,2000,700000,",
    "Arizona,State,1910,100,",
  ].join("\n"),
  apportionmentPopulation: "census,state,apportionment_population\n2000,WY,1000001\n",
  candidates:
    "year,candidate,name,party\n1992,dem,Dee,D\n1992,rep,Arr,R\n1992,ind,Indy,Independent\n",
  electoralVotes: [
    "year,state,candidate,electoral_votes",
    "1992,CA,dem,8",
    "1992,NE,rep,4",
    "1992,NE,dem,1",
    "1992,WY,ind,3",
    "1996,CA,dem,8",
    "1992,DC,dem,2",
    "1992,DC,abstain,1",
    "1992,DC,rep,0",
  ].join("\n"),
  faithless: "year,state,cast_for,pledged_to,count\n1992,WY,ind,rep,3\n1992,DC,abstain,dem,1\n",
  popularVotes: [
    "year,state,candidate,votes",
    "1992,CA,dem,600",
    "1992,CA,rep,500",
    "1992,NE,rep,300",
    "1992,NE,dem,280",
    "1992,WY,rep,40",
    "1992,WY,dem,60",
    "1992,WY,ind,",
  ].join("\n"),
};

export const data = buildDataset(files);
