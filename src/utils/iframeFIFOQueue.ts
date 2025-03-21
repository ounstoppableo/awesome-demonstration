const _iframeFIFOQueue: Promise<any>[] = [];
const _cache: (() => Promise<any>)[] = [];

const dispatch = () => {
  if (_iframeFIFOQueue.length === 0) {
    _iframeFIFOQueue.push(_cache.pop()!());
    traverse();
  }
};

const addToFIFOQueue = async (producer: () => Promise<any>) => {
  _cache.push(producer);
  dispatch();
};

const traverse = async () => {
  await Promise.all(_iframeFIFOQueue);
  if (_cache.length !== 0) {
    _iframeFIFOQueue.push(_cache.pop()!());
    traverse();
  } else {
    _iframeFIFOQueue.length = 0;
  }
};

export default addToFIFOQueue;
