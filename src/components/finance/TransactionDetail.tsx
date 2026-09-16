import { useEffect, useMemo, useState } from 'react';
import type { CategoryId, Transaction } from '../../data';
import { CATEGORY_OPTIONS, categoryLabel, categoryTint, data } from '../../data';
import { currency, formatLongDate } from '../../lib/format';
import { useCopyToClipboard } from '../../lib/hooks';
import { useStore } from '../../state/store';
import { Button, Divider, MonoLabel } from '../ui/primitives';
import { Drawer } from '../ui/overlays';
import { Field, Select, Textarea } from '../ui/controls';
import { IconCheck, IconRepeat, IconSplit } from '../ui/icons';
import { Amount, KeyValue, MerchantMark } from './atoms';

export function TransactionDetail({
  transaction,
  onClose,
}: {
  transaction: Transaction | null;
  onClose: () => void;
}) {
  const { overrides, setOverride } = useStore();
  const [note, setNote] = useState('');
  const [splitting, setSplitting] = useState(false);
  const [splitAmount, setSplitAmount] = useState('');
  const [splitCategory, setSplitCategory] = useState<CategoryId>('other');
  const [copied, copy] = useCopyToClipboard();

  const override = transaction ? overrides[transaction.id] : undefined;

  useEffect(() => {
    setNote(override?.note ?? '');
    setSplitting(false);
    setSplitAmount('');
  }, [transaction?.id, override?.note]);

  const account = transaction ? data.accountById.get(transaction.accountId) : undefined;
  const category = transaction
    ? (override?.categoryId ?? transaction.categoryId)
    : 'other';
  const isRecurring = transaction ? (override?.recurring ?? transaction.recurring ?? false) : false;

  const related = useMemo(() => {
    if (!transaction) return [];
    return data.transactions
      .filter((tx) => tx.merchant === transaction.merchant && tx.id !== transaction.id)
      .slice(0, 4);
  }, [transaction]);

  const merchantTotal = useMemo(() => {
    if (!transaction) return 0;
    return data.transactions
      .filter((tx) => tx.merchant === transaction.merchant && tx.date.slice(0, 7) === data.anchor.slice(0, 7))
      .reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
  }, [transaction]);

  const splits = override?.splits ?? [];
  const splitTotal = splits.reduce((acc, part) => acc + part.amount, 0);

  const commitSplit = () => {
    if (!transaction) return;
    const value = Number.parseFloat(splitAmount);
    const ceiling = Math.abs(transaction.amount) - splitTotal;
    if (!Number.isFinite(value) || value <= 0 || value > ceiling) return;
    setOverride(transaction.id, {
      splits: [
        ...splits,
        { label: categoryLabel(splitCategory), amount: value, categoryId: splitCategory },
      ],
    });
    setSplitAmount('');
    setSplitting(false);
  };

  return (
    <Drawer
      open={Boolean(transaction)}
      onClose={onClose}
      title={transaction?.merchant ?? ''}
      description="Transaction"
      footer={
        transaction && (
          <div className="flex items-center justify-between gap-12">
            <button
              type="button"
              onClick={() => copy(transaction.id.toUpperCase())}
              className="mono-data inline-flex items-center gap-6 text-[10px] text-ash transition-colors hover:text-cloud"
            >
              {copied ? <IconCheck size={12} /> : null}
              {copied ? 'Reference copied' : `Ref ${transaction.id.toUpperCase()}`}
            </button>
            <Button tone="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        )
      }
    >
      {transaction && (
        <div className="px-20 pb-24 sm:px-24">
          <div className="flex items-center gap-16 py-24">
            <MerchantMark name={transaction.merchant} categoryId={category} size={48} />
            <div className="min-w-0">
              <p className="font-lyon-display text-heading-lg leading-none text-cloud">
                <Amount value={transaction.amount} signed />
              </p>
              <p className="mt-8 text-caption text-ash">{formatLongDate(transaction.date)}</p>
            </div>
          </div>

          {transaction.pending && (
            <p className="mb-20 rounded-lg border border-hairline bg-glass px-12 py-10 text-caption text-ash">
              This authorisation has not settled yet. The final amount can still change.
            </p>
          )}

          <Divider />

          <dl className="divide-y divide-white/6">
            <KeyValue label="Category">
              <span className="inline-flex items-center gap-8">
                <span
                  aria-hidden="true"
                  className="size-8 rounded-full"
                  style={{ backgroundColor: categoryTint(category) }}
                />
                {categoryLabel(category)}
              </span>
            </KeyValue>
            <KeyValue label="Account">{account?.name ?? '—'}</KeyValue>
            <KeyValue label="Type">
              {transaction.type === 'transfer'
                ? 'Internal transfer'
                : transaction.amount > 0
                  ? 'Credit'
                  : 'Debit'}
            </KeyValue>
            {transaction.method && <KeyValue label="Method">{transaction.method}</KeyValue>}
            {transaction.location && <KeyValue label="Location">{transaction.location}</KeyValue>}
            <KeyValue label="Status">{transaction.pending ? 'Pending' : 'Settled'}</KeyValue>
            <KeyValue label="Recurring">{isRecurring ? 'Yes — monthly' : 'No'}</KeyValue>
            {merchantTotal > 0 && (
              <KeyValue label="This month at merchant">
                <Amount value={merchantTotal} />
              </KeyValue>
            )}
          </dl>

          <Divider className="my-20" />

          <div className="flex flex-col gap-20">
            <Field label="Categorise" htmlFor="tx-category">
              <Select
                label="Category"
                value={category}
                options={CATEGORY_OPTIONS}
                onChange={(next) => setOverride(transaction.id, { categoryId: next })}
              />
            </Field>

            <Field label="Note" htmlFor="tx-note" hint="Notes stay on this device.">
              <Textarea
                id="tx-note"
                value={note}
                placeholder="What was this for?"
                onChange={(event) => setNote(event.target.value)}
                onBlur={() => setOverride(transaction.id, { note })}
              />
            </Field>

            <div className="flex flex-wrap gap-8">
              <Button
                size="sm"
                tone="ghost"
                onClick={() => setOverride(transaction.id, { recurring: !isRecurring })}
              >
                <IconRepeat size={14} />
                {isRecurring ? 'Not recurring' : 'Mark recurring'}
              </Button>
              <Button size="sm" tone="ghost" onClick={() => setSplitting((prev) => !prev)}>
                <IconSplit size={14} />
                Split transaction
              </Button>
            </div>

            {splitting && (
              <div className="rounded-xl border border-hairline bg-abyss p-16">
                <MonoLabel className="mb-12">New split</MonoLabel>
                <div className="flex flex-col gap-10 sm:flex-row">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={splitAmount}
                    onChange={(event) => setSplitAmount(event.target.value)}
                    placeholder={`Up to ${currency(Math.abs(transaction.amount) - splitTotal)}`}
                    className="h-36 flex-1 rounded-lg border border-hairline bg-obsidian px-12 text-body-sm text-cloud placeholder:text-ash focus:border-hairline-strong"
                  />
                  <Select
                    label="Split category"
                    value={splitCategory}
                    options={CATEGORY_OPTIONS}
                    onChange={setSplitCategory}
                    className="sm:w-180"
                  />
                  <Button size="sm" tone="primary" onClick={commitSplit}>
                    Add
                  </Button>
                </div>
              </div>
            )}

            {splits.length > 0 && (
              <div>
                <MonoLabel className="mb-8">Splits</MonoLabel>
                <ul className="rounded-xl border border-hairline">
                  {splits.map((part, index) => (
                    <li
                      key={`${part.label}-${index}`}
                      className="flex items-center justify-between gap-12 border-b border-hairline px-12 py-10 last:border-b-0"
                    >
                      <span className="flex items-center gap-8 text-body-sm text-cloud">
                        <span
                          aria-hidden="true"
                          className="size-8 rounded-full"
                          style={{ backgroundColor: categoryTint(part.categoryId) }}
                        />
                        {part.label}
                      </span>
                      <span className="tnum text-body-sm text-ash">{currency(part.amount)}</span>
                    </li>
                  ))}
                  <li className="flex items-center justify-between gap-12 px-12 py-10">
                    <span className="text-body-sm text-ash">Remaining</span>
                    <span className="tnum text-body-sm text-cloud">
                      {currency(Math.abs(transaction.amount) - splitTotal)}
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {related.length > 0 && (
            <>
              <Divider className="my-20" />
              <MonoLabel className="mb-4">Earlier at {transaction.merchant}</MonoLabel>
              <ul className="divide-y divide-white/6">
                {related.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-16 py-10">
                    <span className="text-caption text-ash">{formatLongDate(item.date)}</span>
                    <span className="tnum text-caption text-cloud">
                      <Amount value={item.amount} signed />
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </Drawer>
  );
}
