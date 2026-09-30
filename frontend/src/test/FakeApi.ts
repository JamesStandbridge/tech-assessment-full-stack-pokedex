import type {
  EntityDetail,
  EntityRef,
  SearchResponse,
  SpeciesResponse,
  SuggestResponse,
} from "../api/contract";
import { ApiError } from "../api/errors";
import type { PokedexApi, SearchParams } from "../api/ports";
import { speciesList } from "./recorded/speciesList";

type Answer<T> = T | ApiError;

/** A typed double of every port, answering from recorded responses. */
export class FakeApi implements PokedexApi {
  readonly searches: SearchParams[] = [];
  private readonly searchAnswers = new Map<string, Answer<SearchResponse>[]>();
  private readonly entityAnswers = new Map<string, EntityDetail>();

  answerSearch(query: string, ...answers: Answer<SearchResponse>[]): this {
    this.searchAnswers.set(query, answers);
    return this;
  }

  answerEntity(detail: EntityDetail): this {
    this.entityAnswers.set(`${detail.kind}:${detail.name}`, detail);
    return this;
  }

  search(params: SearchParams): Promise<SearchResponse> {
    this.searches.push(params);
    const answers = this.searchAnswers.get(params.query) ?? [];
    const answer = answers.length > 1 ? answers.shift() : answers[0];
    if (answer === undefined) return Promise.reject(new ApiError("failed", "No answer."));
    return answer instanceof ApiError ? Promise.reject(answer) : Promise.resolve(answer);
  }

  suggest(): Promise<SuggestResponse> {
    return Promise.resolve({ suggestions: [] });
  }

  species(): Promise<SpeciesResponse> {
    return Promise.resolve(speciesList);
  }

  entity(ref: EntityRef): Promise<EntityDetail> {
    const detail = this.entityAnswers.get(`${ref.kind}:${ref.name}`);
    return detail === undefined
      ? Promise.reject(new ApiError("not-found", "Missing."))
      : Promise.resolve(detail);
  }
}
