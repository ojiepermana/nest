export interface FilterQuery {
  [key: string]: unknown;
  _page?: number;
  _limit?: number;
  _sort?: string;
  _order?: 'asc' | 'desc';
  _offset?: number;
}

export interface CompiledQuery {
  text: string;
  values: unknown[];
}

interface OperatorHandler {
  (field: string, value: unknown, state: CompilationState): void;
}

interface CompilationState {
  conditions: string[];
  values: unknown[];
}

const OPERATORS: Record<string, OperatorHandler> = {
  eq: (field, value, state) => {
    state.values.push(value);
    state.conditions.push(`"${field}" = $${state.values.length}`);
  },
  neq: (field, value, state) => {
    state.values.push(value);
    state.conditions.push(`"${field}" <> $${state.values.length}`);
  },
  like: (field, value, state) => {
    state.values.push(`%${value}%`);
    state.conditions.push(`"${field}" ILIKE $${state.values.length}`);
  },
  ilike: (field, value, state) => {
    state.values.push(value);
    state.conditions.push(`"${field}" ILIKE $${state.values.length}`);
  },
  gt: (field, value, state) => {
    state.values.push(value);
    state.conditions.push(`"${field}" > $${state.values.length}`);
  },
  gte: (field, value, state) => {
    state.values.push(value);
    state.conditions.push(`"${field}" >= $${state.values.length}`);
  },
  lt: (field, value, state) => {
    state.values.push(value);
    state.conditions.push(`"${field}" < $${state.values.length}`);
  },
  lte: (field, value, state) => {
    state.values.push(value);
    state.conditions.push(`"${field}" <= $${state.values.length}`);
  },
  between: (field, value, state) => {
    const [start, end] = parseArrayValue(value);
    if (start === undefined || end === undefined) {
      return;
    }
    state.values.push(start, end);
    const first = state.values.length - 1;
    const second = state.values.length;
    state.conditions.push(`"${field}" BETWEEN $${first} AND $${second}`);
  },
  in: (field, value, state) => {
    const list = parseArrayValue(value).filter((entry) => entry !== undefined);
    if (list.length === 0) {
      return;
    }
    const placeholders: string[] = [];
    list.forEach((entry) => {
      state.values.push(entry);
      placeholders.push(`$${state.values.length}`);
    });
    state.conditions.push(`"${field}" IN (${placeholders.join(', ')})`);
  },
};

const parseArrayValue = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return [];
};

const RESERVED_KEYS = new Set(['_page', '_limit', '_sort', '_order', '_offset']);

export const buildFilterQuery = (baseQuery: string, filter: FilterQuery = {}): CompiledQuery => {
  const state: CompilationState = {
    conditions: [],
    values: [],
  };

  for (const [key, value] of Object.entries(filter)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    if (RESERVED_KEYS.has(key)) {
      continue;
    }

    const { field, operator } = parseFilterKey(key);
    const handler = OPERATORS[operator];
    if (!handler) {
      state.values.push(value);
      state.conditions.push(`"${field}" = $${state.values.length}`);
      continue;
    }

    handler(field, value, state);
  }

  let queryText = baseQuery;
  if (state.conditions.length > 0) {
    queryText += (baseQuery.toUpperCase().includes('WHERE') ? ' AND ' : ' WHERE ') + state.conditions.join(' AND ');
  }

  const orderColumn = filter._sort;
  if (orderColumn) {
    const order = filter._order?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    queryText += ` ORDER BY "${orderColumn}" ${order}`;
  }

  const limit = resolveNumber(filter._limit);
  const page = resolveNumber(filter._page, 1);
  const offset = resolveNumber(filter._offset);

  if (limit !== undefined) {
    queryText += ` LIMIT ${limit}`;
    const computedOffset = offset ?? (page !== undefined ? (page - 1) * limit : undefined);
    if (computedOffset !== undefined) {
      queryText += ` OFFSET ${computedOffset}`;
    }
  } else if (offset !== undefined) {
    queryText += ` OFFSET ${offset}`;
  }

  return {
    text: queryText,
    values: state.values,
  };
};

const parseFilterKey = (key: string): { field: string; operator: keyof typeof OPERATORS } => {
  const match = key.match(/(.+)_([a-z]+)$/);
  if (!match) {
    return { field: key, operator: 'eq' };
  }
  const [, field, operator] = match;
  if (operator in OPERATORS) {
    return { field, operator: operator as keyof typeof OPERATORS };
  }
  return { field: key, operator: 'eq' };
};

const resolveNumber = (value: unknown, fallback?: number): number | undefined => {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value === 'number') {
    return Number.isNaN(value) ? fallback : value;
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};
