export const currency = (n) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "MYR",
  }).format(n);

export const classNames = (...xs) => xs.filter(Boolean).join(" ");
