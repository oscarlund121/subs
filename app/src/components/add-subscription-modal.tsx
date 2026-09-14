import { useMemo } from 'react';
import { api } from '@/lib/api';
import {
  SubscriptionFormSheet,
  emptyFormValues,
} from './subscription-form-sheet';

export function AddSubscriptionModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  // New defaults each time the sheet opens, so the renewal date stays relative
  // to today rather than to when the app launched.
  const initial = useMemo(() => emptyFormValues(), [visible]);

  return (
    <SubscriptionFormSheet
      visible={visible}
      title="New subscription"
      submitLabel="Add subscription"
      initial={initial}
      onCancel={onClose}
      onSubmit={async (values) => {
        await api.createSubscription({ ...values, status: 'active', source: 'Manual' });
        onCreated();
        onClose();
      }}
    />
  );
}
