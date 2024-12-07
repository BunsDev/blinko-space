import { IconButton } from '../IconButton';
import { useTranslation } from 'react-i18next';
import { NoteType } from '@/server/types';
import { BlinkoStore } from '@/store/blinkoStore';
import { RootStore } from '@/store';
import { Div } from '@/components/Common/Div';

export const NoteTypeButton = () => {
  const { t } = useTranslation();
  const blinko = RootStore.Get(BlinkoStore);

  return (
    <Div
      onTap={() => {
        blinko.noteTypeDefault = blinko.noteTypeDefault == NoteType.BLINKO ? NoteType.NOTE : NoteType.BLINKO;
      }}>
      <IconButton
        icon={blinko.noteTypeDefault == NoteType.BLINKO ? 'basil:lightning-solid' : 'solar:notes-minimalistic-bold-duotone'}
        classNames={{
          icon: blinko.noteTypeDefault == NoteType.BLINKO ? 'text-[#FFD700]' : 'text-[#3B82F6]'
        }}
        tooltip={blinko.noteTypeDefault == NoteType.BLINKO ? t('blinko') : t('note')}
      />
    </Div>

  );
}; 