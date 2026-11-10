import { Pipe, PipeTransform } from '@angular/core';
import { formatDmy } from '../../core/util/dates';
import { formatMoney, formatNumber, formatPct } from '../../core/util/money';

/** 1234567 -> "1,234,567 ج.م" */
@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatMoney(value ?? 0);
  }
}

/** 1234567 -> "1,234,567" */
@Pipe({ name: 'num' })
export class NumPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatNumber(value ?? 0);
  }
}

/** "2026-03-05" -> "05/03/2026" */
@Pipe({ name: 'dmy' })
export class DmyPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatDmy(value);
  }
}

/** 87.4 -> "87%" */
@Pipe({ name: 'pct' })
export class PctPipe implements PipeTransform {
  transform(value: number | null | undefined, digits = 0): string {
    return formatPct(value ?? 0, digits);
  }
}
