import type { Question } from '../../quiz/types';
import { csQuestionBanks1 } from './q1';
import { csQuestionBanks2 } from './q2';

// Computer science quiz bank. One builder per topic in q1.ts / q2.ts; ids are re-assigned positionally here so they stay unique.
export const csQuestions: Question[] = [...csQuestionBanks1, ...csQuestionBanks2]
	.flatMap((b) => b.out)
	.map((q, i) => ({ ...q, id: 'CS' + String(i + 1).padStart(2, '0') }));
