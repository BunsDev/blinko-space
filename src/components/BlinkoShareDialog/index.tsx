import { observer } from "mobx-react-lite";
import { Button, Card, Switch, Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Popover, PopoverTrigger, PopoverContent, InputOtp, Divider } from "@nextui-org/react";
import { today, getLocalTimeZone, parseDate } from "@internationalized/date";
import dayjs from "@/lib/dayjs";
import { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { Calendar } from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";
import { RootStore } from "@/store";
import { BlinkoStore } from "@/store/blinkoStore";
import { useTranslation } from "react-i18next";
import { DialogStore } from "@/store/module/Dialog";
import { Copy } from "../Common/Copy";

interface ShareDialogProps {
  defaultSettings: ShareSettings;
  shareUrl?: string;
}

export interface ShareSettings {
  expiryDate?: Date;
  password?: string;
  shareUrl?: string;
  isShare?: boolean;
}

const expiryOptions = [
  { key: "never", label: ("permanent-valid") },
  { key: "7days", label: ("7days-expiry") },
  { key: "30days", label: ("30days-expiry") },
  { key: "custom", label: ("custom-expiry") },
];

const generateRandomPassword = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const BlinkoShareDialog = observer(({ defaultSettings }: ShareDialogProps) => {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<ShareSettings>(() => {
    const initialPassword = defaultSettings.shareUrl ? defaultSettings.password : generateRandomPassword();
    return {
      ...defaultSettings,
      password: initialPassword
    };
  });
  const [expiryType, setExpiryType] = useState<string>(() => {
    return defaultSettings.expiryDate ? "custom" : "never";
  });
  const [isPublic, setIsPublic] = useState(!defaultSettings.password);
  const [isShare, setIsShare] = useState<boolean>(defaultSettings.isShare ?? false);

  const [shareUrl, setShareUrl] = useState<string>(defaultSettings?.shareUrl ?? '');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const selectedExpiryValue = useMemo(() => {
    if (expiryType === "never") return t("permanent-valid");
    if (settings.expiryDate) {
      return dayjs(settings.expiryDate).format('YYYY-MM-DD');
    }
    return t("select-expiry-time");
  }, [expiryType, settings.expiryDate, t]);

  const handleExpiryChange = (type: string) => {
    setExpiryType(type);
    if (type === "never") {
      setSettings({ ...settings, expiryDate: undefined });
    } else if (type === "7days") {
      setSettings({
        ...settings,
        expiryDate: dayjs().add(7, 'days').toDate()
      });
    } else if (type === "30days") {
      setSettings({
        ...settings,
        expiryDate: dayjs().add(30, 'days').toDate()
      });
    } else {
      setSettings({
        ...settings,
        expiryDate: settings.expiryDate || dayjs().add(1, 'day').toDate()
      });
      setIsCalendarOpen(true);
    }
  };

  return (
    <Card shadow="none" className="flex flex-col gap-8 p-2 -mt-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 ">
          <span className="text-default-700 font-medium">{t("expiry-time")}</span>
          <AnimatePresence mode="wait">
            {settings.expiryDate && (
              <motion.div
                className="ml-auto bg-[#FEF4D5] text-sm text-[#F68C06] px-2 py-1 rounded-full flex items-center gap-2"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Icon icon="lets-icons:clock" className="text-[#F68C06]" width="20" height="20" />
                {dayjs(settings.expiryDate).fromNow()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-2 mt-2">
          <Dropdown>
            <DropdownTrigger>
              <Button
                size="lg"
                variant="ghost"
                className="flex-1 justify-start"
                startContent={<Icon icon="solar:calendar-bold" className="text-default-500" width="20" height="20" />}
              >
                {selectedExpiryValue}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              onAction={(key) => handleExpiryChange(key as string)}
              selectedKeys={[expiryType]}
            >
              {expiryOptions.map((option) => (
                <DropdownItem key={option.key}>
                  {t(option.label)}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          {expiryType === "custom" && (
            <Popover
              isOpen={isCalendarOpen}
              onOpenChange={setIsCalendarOpen}
              placement="bottom-end"
            >
              <PopoverTrigger>
                <Button
                  size="lg"
                  startContent={<Icon icon="solar:calendar-mark-bold" className="text-default-500" width="20" height="20" />}
                >
                  {settings.expiryDate ? dayjs(settings.expiryDate).format('YYYY-MM-DD') : t("select-date")}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="p-1 bg-content1">
                  <Calendar
                    minValue={today(getLocalTimeZone())}
                    // @ts-ignore
                    value={settings.expiryDate ? parseDate(dayjs(settings.expiryDate).format('YYYY-MM-DD')) : today(getLocalTimeZone()).add({ days: 1 })}
                    onChange={(date) => {
                      if (date) {
                        setSettings({
                          ...settings,
                          // @ts-ignore
                          expiryDate: new Date(date.toString())
                        });
                        setIsCalendarOpen(false);
                      }
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-default-700 font-medium">{t("access-password")}</span>
          <span className="text-default-400 text-sm">{t("protect-your-shared-content")}</span>
          <Switch
            className="ml-auto"
            size="sm"
            isSelected={!isPublic}
            onValueChange={(checked) => {
              setIsPublic(!checked);
              if (checked) {
                setSettings({ ...settings, password: generateRandomPassword() });
              }
            }}
          />
        </div>
        <div className="flex w-full justify-center items-center">
          {!isPublic && (
            <InputOtp
              size="lg"
              length={6}
              placeholder={t("set-access-password")}
              value={settings.password}
              onValueChange={(value) => setSettings({ ...settings, password: value })}
            />
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {
          shareUrl && (
            <motion.div
              className="flex flex-col gap-2"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-default-700 font-medium">{t("share-link")}</span>
              </div>
              <div className="flex gap-2 items-center">
                <Input
                  value={shareUrl}
                  readOnly
                />
                <Copy content={shareUrl} size={24} />
              </div>
            </motion.div>
          )
        }
      </AnimatePresence>

      <div className="w-full flex items-end gap-4">
        {
          isShare && (
            <Button variant="flat" className="w-full" onPress={() => {
              RootStore.Get(BlinkoStore).shareNote.call({
                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                id: RootStore.Get(BlinkoStore).curSelectedNote!.id!,
                isCancel: true,
              })
              setIsShare(false)
              RootStore.Get(DialogStore).close()
            }}>
              {t("cancel-share")}
            </Button>
          )
        }
        <Button color="primary" className="w-full" onPress={async () => {
          const res = await RootStore.Get(BlinkoStore).shareNote.call({
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            id: RootStore.Get(BlinkoStore).curSelectedNote!.id!,
            isCancel: false,
            password: isPublic ? "" : settings.password,
            expireAt: settings.expiryDate
          })
          setShareUrl(`${window.location.origin}/share/${res?.shareEncryptedUrl ?? ''}${isPublic ? '' : `?password=${settings.password ?? ''}`}`)
          setIsShare(true)
        }}>
          {t("create-share")}
        </Button>
      </div>
    </Card>
  );
});
