// All images live here. Import this in every other module.
export let images = [];
export let idCounter = 0;
export const nextId = () => ++idCounter;
export const addImage = (img) => images.push(img);
export const removeImage = (id) => {
  const index = images.findIndex(i => i.id === id);
  if (index === -1) return null;

  const [removed] = images.splice(index, 1);
  if (removed?.objectURL) URL.revokeObjectURL(removed.objectURL);
  return removed;
};

export const resetState = () => {
  images.forEach(img => {
    if (img?.objectURL) URL.revokeObjectURL(img.objectURL);
  });
  images = [];
  idCounter = 0;
};

export const getImage = (id) => images.find(i => i.id === id);