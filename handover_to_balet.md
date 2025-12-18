# بسته تحویل برای تیم «بالِت» – اعمال تغییرات نسخه B روی پروژه مقصد

- **نسخه مرجع (A):** `project-survay-final-7-الان دایال پلن هم درست شده.zip`
- **نسخه جدید/متصل به API (B):** `پروژه الان بالت.zip`

## خلاصهٔ تفاوت‌ها
- فایل‌های اضافه‌شده در B: **39**
- فایل‌های حذف‌شده نسبت به A: **12545**
- فایل‌های ویرایش‌شده (متنی): **0**
- فایل‌های ویرایش‌شده (باینری/نامشخص): **0**

### فایل‌های کامل (CSV)
- Added: `added_files.csv`
- Removed: `removed_files.csv`

## مراحل اجرایی (DevOps)
1) **پشتیبان‌گیری از پروژه فعلی**
```bash
BACKUP_DATE=$(date +%F-%H%M)
sudo mkdir -p /opt/backups
sudo tar -czf /opt/backups/survay-$BACKUP_DATE.tgz /var/www/html/survay
```

2) **دیپلوی نسخهٔ جدید (B) روی مسیر پروژه**
```bash
# فرض: محتویات نسخه B در ./B_zip_extracted است
sudo rsync -av --delete ./B_zip_extracted/ /var/www/html/survay/
sudo chown -R apache:apache /var/www/html/survay
sudo find /var/www/html/survay -type f -name "*.php" -exec chmod 0644 {} +
sudo find /var/www/html/survay -type d -exec chmod 0755 {} +
# اگر SELinux فعال است:
sudo which restorecon >/dev/null 2>&1 && sudo restorecon -R /var/www/html/survay || true
```

3) **ریلود سرویس‌های وب و تلفنی (در صورت استفاده)**
```bash
sudo systemctl reload httpd || sudo systemctl reload apache2 || true
sudo asterisk -rx "dialplan reload" || true
```

## Endpointها و پارامترهای ورودی (بر پایه نسخه B)
- (اسکریپت‌های شناخته‌شده به‌صورت صریح یافت نشدند یا خارج از مسیر /api هستند؛ فهرست کامل در `added_files.csv`.)

## چک‌لیست صحت‌سنجی پس از دیپلوی
- صفحهٔ UI مرتبط باز شود و آپلود/پست‌کردن به API تست شود.
- مسیر ذخیرهٔ فایل‌های صوتی (مثلاً `/var/lib/asterisk/sounds/custom`) بررسی و دسترسی‌ها تنظیم شود.
- در صورت وجود صف، `Queue Continue Destination` روی مقصد سفارشی تنظیم و با `asterisk -rx "dialplan show"` صحت‌سنجی شود.
- لاگ‌ها بررسی شوند: `/var/log/httpd/error_log` و `/var/log/asterisk/full`.

---
*این فایل به‌همراه CSVهای لیست فایل‌ها برای تیم «بالِت» آمادهٔ ارسال است.*
