/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DayId = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';

export interface ProductItem {
  id: string;
  name: string;
  quantity: number;
}

export interface DayProduction {
  id: DayId;
  name: string;
  worked: boolean;
  products: ProductItem[];
}
