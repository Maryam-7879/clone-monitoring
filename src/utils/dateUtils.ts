import moment from 'moment-jalaali';

// Configure moment-jalaali
moment.loadPersian({ dialect: 'persian-modern' });

export const formatJalaliDate = (date: Date | string): string => {
  return moment(date).format('jYYYY/jMM/jDD');
};

const formatJalaliDateTime = (date: Date | string): string => {
  return moment(date).format('jYYYY/jMM/jDD HH:mm:ss');
};

export const formatJalaliTime = (date: Date | string): string => {
  return moment(date).format('HH:mm:ss');
};

export const getCurrentJalaliDate = (): string => {
  return moment().format('jYYYY/jMM/jDD');
};

export const getCurrentJalaliDateTime = (): string => {
  return moment().format('jYYYY/jMM/jDD HH:mm:ss');
};

const getJalaliDateRange = (days: number): { from: string; to: string } => {
  const to = moment();
  const from = moment().subtract(days, 'days');
  
  return {
    from: from.format('jYYYY/jMM/jDD'),
    to: to.format('jYYYY/jMM/jDD')
  };
};

const parseJalaliDate = (jalaliDate: string): Date => {
  return moment(jalaliDate, 'jYYYY/jMM/jDD').toDate();
};

export const isDateInRange = (date: string, fromDate: string, toDate: string): boolean => {
  if (!fromDate && !toDate) return true;
  
  const targetDate = moment(date, 'jYYYY/jMM/jDD');
  
  if (fromDate && !toDate) {
    const from = moment(fromDate, 'jYYYY/jMM/jDD');
    return targetDate.isSameOrAfter(from, 'day');
  }
  
  if (!fromDate && toDate) {
    const to = moment(toDate, 'jYYYY/jMM/jDD');
    return targetDate.isSameOrBefore(to, 'day');
  }
  
  const from = moment(fromDate, 'jYYYY/jMM/jDD');
  const to = moment(toDate, 'jYYYY/jMM/jDD');
  
  return targetDate.isBetween(from, to, 'day', '[]');
};

const getRelativeJalaliDate = (date: string): string => {
  const targetDate = moment(date, 'jYYYY/jMM/jDD');
  const today = moment();
  const yesterday = moment().subtract(1, 'day');
  
  if (targetDate.isSame(today, 'day')) {
    return 'امروز';
  } else if (targetDate.isSame(yesterday, 'day')) {
    return 'دیروز';
  } else {
    return targetDate.format('jYYYY/jMM/jDD');
  }
};