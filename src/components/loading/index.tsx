import React, { useEffect, useRef, useState } from 'react';
import styles from './index.module.scss';

const Loading = (props: { showLoading: boolean; cubeSize?: number }) => {
  const { showLoading, cubeSize = 120 } = props;

  return showLoading ? (
    <div className="absolute inset-0 flex justify-center items-center z-[45] after:absolute after:inset-0 after:z-[-1] after:bg-black/60 rounded-[inherit]">
      <div className={styles.container}>
        <div
          className={styles.content}
          style={{ '--cubewidth': cubeSize + 'px' } as any}
        >
          <div className={styles.cubeInner}>
            <div className={styles.top} />
            <div className={styles.bottom} />
            <div className={styles.front} />
            <div className={styles.back} />
            <div className={styles.left} />
            <div className={styles.right} />
          </div>
          <div className={styles.cubeOuter}>
            <div className={styles.top} />
            <div className={styles.bottom} />
            <div className={styles.front} />
            <div className={styles.back} />
            <div className={styles.left} />
            <div className={styles.right} />
          </div>
        </div>
      </div>
    </div>
  ) : (
    <></>
  );
};

export default Loading;
