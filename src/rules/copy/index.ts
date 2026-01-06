import type { RuleCopy } from '../../utils/types';
import type { RuleId } from '../meta';
import { ruleCopyEn } from './en';
import { ruleCopyRu } from './ru';

export type Lang = 'en' | 'ru';
export type { RuleId } from '../meta';

export const ruleCopyByLang = {
  en: ruleCopyEn,
  ru: ruleCopyRu,
} as const satisfies Record<Lang, Record<RuleId, RuleCopy>>;

export function getRuleCopy(lang: Lang, ruleId: RuleId): RuleCopy | undefined {
  return ruleCopyByLang[lang]?.[ruleId];
}

export { ruleCopyEn, ruleCopyRu };
