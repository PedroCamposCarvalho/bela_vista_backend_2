export default (dayOfWeek: number): number[] => {
  const arrayToReturn: number[] = [];

  const initialHour = dayOfWeek === 6 ? 8 : 8;

  for (let i = initialHour; i < 22; i++) {
    arrayToReturn.push(i);
  }

  return arrayToReturn;
};
