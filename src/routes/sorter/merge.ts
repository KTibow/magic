async function partition<T>(
  arr: T[],
  low: number,
  high: number,
  compare: (a: T, b: T) => Promise<boolean>,
) {
  let i = low - 1;
  const pivot = arr[high];

  const promises = [];
  for (let j = low; j < high; j++) {
    promises.push(
      compare(arr[j], pivot).then((result) => {
        if (result) {
          i++;
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
      }),
    );
  }
  await Promise.all(promises);

  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}

async function quickselect<T>(
  arr: T[],
  low: number,
  high: number,
  k: number,
  compare: (a: T, b: T) => Promise<boolean>,
) {
  if (low < high) {
    const pivotIndex = await partition(arr, low, high, compare);

    if (k === pivotIndex) {
      return;
    } else if (k < pivotIndex) {
      await quickselect(arr, low, pivotIndex - 1, k, compare);
    } else {
      await quickselect(arr, pivotIndex + 1, high, k, compare);
    }
  }
}

export async function findTopKElements<T>(
  arr: T[],
  k: number,
  compare: (a: T, b: T) => Promise<boolean>,
) {
  await quickselect(arr, 0, arr.length - 1, arr.length - k, compare);
  console.log(arr.map((x) => x.artist));
  return arr.reverse().slice(0, k);
}
