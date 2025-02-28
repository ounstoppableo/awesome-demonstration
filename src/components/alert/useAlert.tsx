import { result } from 'lodash';
import { Alert } from '.';
import { CircleAlert } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectAlert,
  selectAlertMsg,
  setAlert,
} from '@/store/alert/alert-slice';
import { useEffect, useRef, useState } from 'react';

export default function useAlert(props: any) {
  const { duration = 3000 } = props;
  const dispatch = useAppDispatch();
  const alert = useAppSelector(selectAlert);
  const msg = useAppSelector(selectAlertMsg);
  const antiShake = useRef<any>(null);
  useEffect(() => {
    if (alert) {
      if (antiShake.current) clearTimeout(antiShake.current);
      antiShake.current = setTimeout(() => {
        dispatch(setAlert(false));
      }, duration);
    }
  }, [alert]);
  const alertVDom = alert ? (
    <div className="absolute top-4 w-fit left-1/2 -translate-x-1/2 z-[9999]">
      <Alert
        layout="row"
        icon={
          <CircleAlert className="text-amber-500" size={16} strokeWidth={2} />
        }
      >
        <p className="text-sm">{msg}</p>
      </Alert>
    </div>
  ) : (
    <></>
  );
  return { alertVDom };
}
