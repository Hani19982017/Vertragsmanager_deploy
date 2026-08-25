/* Vertragsmanager — client */
'use strict';

var L = localStorage.getItem('vm_lang') || 'de';
var ME = null, V = 'dash', SEL = null, Q = '', TB = 'all', CACHE = {};

/* ---------------- i18n ---------------- */
var T = {
de:{app:"Vertragsmanager",tagline:"Verträge · Kunden · Kommunikation",
 login:"Anmelden",signup:"Konto erstellen",toSignup:"Neues Konto erstellen",toLogin:"Ich habe ein Konto",
 company:"Firmenname",name:"Ihr Name",email:"E-Mail",pw:"Passwort",pwHint:"Mindestens 8 Zeichen",
 logout:"Abmelden",other:"العربية",
 fbLink:"Feedback senden",fbTitle:"Feedback / Vorschlag",
 fbHint:"Anmerkungen oder Verbesserungsvorschläge an das Plattform-Team senden.",
 fbSend:"Senden",fbOk:"Danke! Ihr Feedback wurde gesendet.",fbOff:"Feedback ist noch nicht eingerichtet.",
 g1:"Arbeit",g2:"Verwaltung",
 nav:{dash:"Übersicht",cust:"Kunden",docs:"Dokumente",ops:"Chancen",team:"Team",set:"Einstellungen"},
 m1:"Sofort kontaktieren",m2:"In 60 Tagen",m3:"Wiedervorlagen",m4:"Kunden",
 prio:"Prioritätsliste",sortedBy:"Sortiert nach letztem Kündigungstermin",
 fupOpen:"Offene Wiedervorlagen",fupToday:"Heute fällig",overdue:"überfällig",
 days:"Tage",ends:"endet",avail:"verfügbar",noRes:"Keine Einträge",back:"Zurück",
 srv:{electricity:"Strom",gas:"Gas",internet:"Internet / DSL",mobile:"Mobilfunk",kfz:"Kfz-Versicherung",
  health:"Krankenversicherung",liability:"Haftpflichtversicherung",home:"Hausratversicherung",
  legal:"Rechtsschutzversicherung",other:"Sonstige"},
 st:{active:"Aktiv",renewal_due:"Fällig",contacted:"Kontaktiert",renewed:"Verlängert",
  lost:"Verloren",cancelled_early:"Storniert",expired:"Abgelaufen"},
 subm:{submitted:"Eingereicht",review:"In Prüfung",confirmed:"Bestätigt",rejected:"Abgelehnt"},
 tabs:{all:"Alle",due:"Fällig",renewed:"Verlängert",lost:"Nicht verlängert"},
 search:"Suchen…",archT:"Vertrag archivieren",
 archS:"Unterschriebenen Vertrag hochladen — das System erinnert rechtzeitig vor Ablauf.",
 archB:"Archivieren",dzT:"Vertragsdokument hochladen",dzS:"PDF oder Foto — die Felder werden automatisch ausgefüllt",
 dzOk:"Daten übernommen — bitte prüfen",orMan:"oder manuell eingeben",
 reading:"Datei wird gelesen…",ocr:"Text wird aus dem Bild gelesen — einen Moment…",
 readErr:"Datei konnte nicht gelesen werden",found:"{n} Felder erkannt — bitte prüfen",
 nothing:"Keine Daten erkannt — bitte manuell eingeben",
 fName:"Vorname",lName:"Nachname",phone:"Telefon",waNum:"WhatsApp-Nummer",mail:"E-Mail",
 street:"Straße und Hausnummer",plz:"PLZ",city:"Ort",addr:"Adresse",
 fSrv:"Dienstleistung",fProv:"Anbieter",fNum:"Vertragsnummer",fSigned:"Unterschrieben am",
 fStart:"Beginn",fEnd:"Vertragsende",fNot:"Kündigungsfrist (Tage)",fLead:"Erinnerung (Tage vorher)",
 subT:"Status beim Anbieter",calcL:"Letzter Kündigungstermin",
 save:"Speichern",cancel:"Abbrechen",confirm:"Bestätigen",
 outT:"Ergebnis erfassen",outS:"Ergebnis des Kontakts erfassen.",
 oRen:"Verlängert",oRef:"Abgelehnt",oPos:"Verschoben",oNo:"Nicht erreicht",
 lostT:"Kunde hat woanders unterschrieben",
 lostS:"Der Kunde kehrt automatisch in die Warteschlange zurück.",
 lostP:"Neuer Anbieter",dur:"Laufzeit (Monate)",
 fupT:"Wiedervorlage",fupS:"Wann sollen wir uns wieder melden?",fupD:"Datum",fupN:"Notiz",
 q3:"in 3 Tagen",q7:"in 1 Woche",q14:"in 2 Wochen",q30:"in 1 Monat",fupClear:"Löschen",
 contracts:"Verträge",activity:"Verlauf",docsT:"Dokumente",storageUsed:"Speicherplatz",txtData:"Text",filesData:"Dateien",totalStorT:"Gesamter Speicherplatz",allCustStor:"Alle Kunden",cross:"Cross-Selling",hh:"Gleiche Adresse",
 noDoc:"Keine Dokumente",noAct:"Noch keine Aktivität",noFile:"Kein Vertragsdokument hinterlegt",
 editC:"Kontaktdaten bearbeiten",moveT:"Umzug melden",
 delCust:"Kunde löschen",delContr:"Vertrag löschen",
 delCustQ:"Diesen Kunden mit ALLEN Verträgen, Dokumenten und dem Verlauf endgültig löschen? Dies kann nicht rückgängig gemacht werden.",
 delContrQ:"Diesen Vertrag mit seinen Dokumenten endgültig löschen? Dies kann nicht rückgängig gemacht werden.",
 delType:"Zum Bestätigen LÖSCHEN eingeben",delWord:"LÖSCHEN",deleted:"Gelöscht",delCancel:"Abbrechen",delConfirm:"Endgültig löschen",
 moveS:"Ein Umzug beendet Strom- und Gasverträge sofort — und eröffnet neue.",
 moveD:"Umzugsdatum",addC:"Vertrag hinzufügen",
 wa:"WhatsApp",em:"E-Mail",ph:"Telefon",callS:"Diese Nummer auf dem Handy wählen.",
 copy:"Kopieren",copied:"Kopiert",openWa:"In WhatsApp öffnen",openMail:"E-Mail schreiben",
 msgT:"Nachrichtenvorlage",subj:"Betreff",after:"Danach Ergebnis erfassen",
 tpl:"Hallo {n}, Ihr {s}-Vertrag bei {p} endet am {e}. Die Kündigungsfrist läuft noch bis {d}. Ich habe ein besseres Angebot für Sie — sollen wir kurz sprechen?",
 tplS:"Ihr {s}-Vertrag endet am {e}",
 opsT:"Chancen und offene Punkte",priceT:"Preiserhöhung",
 priceS:"Anbieter wählen — alle betroffenen Kunden haben Sonderkündigungsrecht",
 priceR:"Sonderkündigungsrecht",affected:"betroffene Kunden",
 noConf:"Nicht bestätigt",lateC:"{n} Tage ohne Rückmeldung",
 widT:"Widerruf läuft",widS:"14-Tage-Widerrufsfrist — noch nicht endgültig",
 teamT:"Team",invite:"Mitarbeiter einladen",owner:"Inhaber",agent:"Mitarbeiter",
 handT:"Kunden übergeben",handTo:"Übergeben an",seatFull:"Sitzplatzlimit erreicht",
 inviteOk:"Einladung erstellt. Link kopieren und senden:",
 setT:"Einstellungen",expT:"Kundenliste exportieren",ownOnly:"Nur für den Inhaber",
 expBlk:"Export gesperrt — nur der Inhaber darf die Kundenliste herunterladen",
 logT:"Zugriffsprotokoll",dupT:"Mögliche Dubletten",noDup:"Keine Dubletten gefunden",
 usage:"Nutzung",custs:"Kunden",seats:"Mitarbeiter",mgr:"Manager",emp:"Mitarbeiter",and:"und",myCust:"Meine Kunden",
 trialN:"Testversion — noch {n} Tage. Alle Funktionen sind freigeschaltet.",
 trialEnd:"Die Testphase ist beendet.",upgrade:"Abonnieren",
 saved:"Gespeichert",added:"Hinzugefügt",done:"Erledigt",err:"Fehler",
 limitCust:"Kundenlimit erreicht — bitte Plan wechseln",
 lglNote:"Entwurf — muss vor Veröffentlichung anwaltlich geprüft werden.",
 ckT:"Cookies und lokale Speicherung",
 ckS:"Wir verwenden technisch notwendige Speichertechnologien, damit die Anwendung funktioniert. Optionale Technologien setzen wir nur mit Ihrer Einwilligung ein.",
 ckNec:"Nur notwendige",ckAll:"Alle akzeptieren",ckMore:"Details",
 searchDocs:"In Dokumenten suchen…",
 nav2:{camp:"Kampagnen",inbox:"Posteingang",rep:"Berichte",bill:"Abonnement"},
 forgot:"Passwort vergessen?",resetT:"Neues Passwort setzen",resetSent:"Wenn die Adresse bekannt ist, wurde eine E-Mail versendet.",
 code2fa:"Code aus der App",twofa:"Zwei-Faktor-Authentifizierung",twofaOn:"Aktiviert",twofaOff:"Deaktiviert",
 enable:"Aktivieren",disable:"Deaktivieren",scan:"Code in der Authenticator-App scannen oder Schlüssel eintragen:",
 campT:"Kampagnen",newCamp:"Neue Kampagne",chan:"Kanal",catT:"Nachrichtentyp",
 catU:"Service — an bestehenden Vertrag gebunden",catM:"Werbung — Einwilligung nötig",
 segT:"Zielgruppe",segA:"Kunden ohne diese Dienstleistung",segB:"Kunden bei diesem Anbieter",
 segC:"Verträge, die in 90 Tagen auslaufen",dlim:"Tageslimit",recip:"Empfänger",
 excl:"ohne Einwilligung ausgeschlossen",daysN:"{n} Tage",optOutT:"Abmeldehinweis wird automatisch angehängt",
 sendNow:"Erste Charge senden",pauseC:"Pausieren",runT:"Läuft",doneT:"Abgeschlossen",pausedT:"Pausiert",
 sentT:"gesendet",autoPause:"Automatisch pausiert — Fehlerquote über 5 %",
 waNote:"WhatsApp-Nachrichten werden zum Versand vorbereitet. Verbinden Sie einen offiziellen Anbieter, um automatisch zu senden.",
 inboxT:"Posteingang",connT:"E-Mail-Konto verbinden",
 connS:"Funktioniert mit Gmail, Outlook, IONOS, Strato, Hostinger und jedem eigenen Server",
 preset:"Anbieter",imapH:"IMAP-Server",portL:"Port",smtpH:"SMTP-Server",appPw:"App-Passwort",
 conn:"Verbinden",disc:"Trennen",syncT:"Abrufen",notConn:"Kein E-Mail-Konto verbunden",
 mailOk:"E-Mail-Konto erfolgreich verbunden",
 mailAuthErr:"Anmeldung fehlgeschlagen. Bei Gmail/Outlook ein App-Passwort verwenden, nicht das normale Passwort.",
 mailConnErr:"Verbindung zum Mailserver fehlgeschlagen. Server und Port prüfen.",
 suggT:"Erkannte Verträge",suggS:"Nichts wird automatisch gespeichert — Sie bestätigen jeden Eintrag",
 archiveIt:"Als Vertrag archivieren",ignoreIt:"Ignorieren",matchedT:"Zugeordnet",unmatchedT:"Kein Kunde erkannt",
 imported:"{n} Nachrichten importiert",
 repT:"Berichte",bySrv:"Nach Dienstleistung",byAgent:"Nach Mitarbeiter",byMonth:"Fällige Verträge je Monat",
 qualT:"Datenqualität",noEnd:"ohne Vertragsende",noNotice:"ohne Kündigungsfrist",
 noDocQ:"ohne Dokument",unpaidQ:"Provision offen",
 billT:"Abonnement",curPlan:"Aktueller Plan",choose:"Auswählen",manage:"Zahlungen verwalten",
 cycMonthly:"Monatlich",cycYearly:"Jährlich",perMo:"/Mon.",perYr:"/Jahr",yrSave:"2 Monate gratis",upgrade:"Upgrade",
 billOff:"Zahlungen sind noch nicht eingerichtet.",
 asstT:"Assistent",asstS:"Schreiben und Nachrichten aus den Daten dieses Kunden",
 asstAsk:"Was soll ich schreiben?",asstPh:"z. B. Kündigung, Widerruf, Verlängerung anbieten…",
 gen:"Erstellen",print:"Drucken",asMail:"Als E-Mail öffnen",result:"Ergebnis",
 k:{kuendigung:"Kündigung",widerruf:"Widerruf (14 Tage)",sonderkuendigung:"Sonderkündigung",
    umzug:"Umzug melden",verlaengerung:"Verlängerung anbieten",crossselling:"Cross-Selling",
    unterlagen:"Unterlagen anfordern"},
 servT:"Dienstleistungen",addSrvT:"Hinzufügen",sendersT:"Absenderadressen",defA:"Standard",
 setDef:"Als Standard",companyT:"Firmendaten",leadT:"Standard-Erinnerung (Tage)",
 protectT:"Mitarbeiter sehen nur eigene Kunden",digestT:"Tägliche Zusammenfassung per E-Mail"},

ar:{app:"Vertragsmanager",tagline:"عقود · زبائن · تواصل",
 login:"تسجيل الدخول",signup:"إنشاء حساب",toSignup:"إنشاء حساب جديد",toLogin:"لدي حساب",
 company:"اسم الشركة",name:"اسمك",email:"البريد الإلكتروني",pw:"كلمة المرور",pwHint:"ثمانية أحرف على الأقل",
 logout:"خروج",other:"Deutsch",
 fbLink:"إرسال ملاحظات",fbTitle:"ملاحظات / اقتراح",
 fbHint:"أرسل ملاحظاتك أو اقتراحاتك لتطوير المنصة إلى فريق المنصة.",
 fbSend:"إرسال",fbOk:"شكرًا! تم إرسال ملاحظتك.",fbOff:"خاصية الملاحظات غير مُعدّة بعد.",
 g1:"العمل",g2:"الإدارة",
 nav:{dash:"لوحة التحكم",cust:"الزبائن",docs:"الملفات",ops:"الفرص",team:"الفريق",set:"الإعدادات"},
 m1:"يحتاج تواصل الآن",m2:"خلال 60 يوماً",m3:"مواعيد المتابعة",m4:"الزبائن",
 prio:"قائمة الأولوية",sortedBy:"مرتبة حسب آخر موعد للإلغاء",
 fupOpen:"مواعيد المتابعة المفتوحة",fupToday:"مستحق اليوم",overdue:"متأخر",
 days:"يوم",ends:"ينتهي",avail:"متاح",noRes:"لا سجلات",back:"رجوع",
 srv:{electricity:"كهرباء",gas:"غاز",internet:"إنترنت",mobile:"هاتف محمول",kfz:"تأمين سيارة",
  health:"تأمين صحي",liability:"تأمين مسؤولية",home:"تأمين منزل",legal:"تأمين قانوني",other:"أخرى"},
 st:{active:"نشط",renewal_due:"مستحق",contacted:"تم التواصل",renewed:"جُدّد",
  lost:"مفقود",cancelled_early:"أُلغي",expired:"منتهٍ"},
 subm:{submitted:"قُدّم",review:"قيد المعالجة",confirmed:"مؤكَّد",rejected:"مرفوض"},
 tabs:{all:"الكل",due:"مستحق",renewed:"جُدّد",lost:"لم يجدد"},
 search:"بحث…",archT:"أرشفة عقد موقّع",
 archS:"ارفع العقد الموقّع — ينبّهك النظام قبل انتهائه بوقت كافٍ.",
 archB:"أرشفة",dzT:"ارفع ملف العقد",dzS:"ملف أو صورة — تُملأ الحقول تلقائياً",
 dzOk:"تم استخراج البيانات — راجعها",orMan:"أو أدخلها يدوياً",
 reading:"جارٍ قراءة الملف…",ocr:"جارٍ قراءة النص من الصورة — لحظات…",
 readErr:"تعذّرت قراءة الملف",found:"تم التعرّف على {n} حقلاً — راجعها",
 nothing:"لم يتعرّف على بيانات — أدخلها يدوياً",
 fName:"الاسم الأول",lName:"اسم العائلة",phone:"الهاتف",waNum:"رقم الواتساب",mail:"البريد",
 street:"الشارع ورقم المنزل",plz:"الرمز البريدي",city:"المدينة",addr:"العنوان",
 fSrv:"الخدمة",fProv:"المزوّد",fNum:"رقم العقد",fSigned:"تاريخ التوقيع",
 fStart:"تاريخ البدء",fEnd:"تاريخ الانتهاء",fNot:"مهلة الإنهاء (أيام)",fLead:"التذكير (أيام قبل)",
 subT:"حالته لدى الشركة",calcL:"آخر موعد للإلغاء",
 save:"حفظ",cancel:"إلغاء",confirm:"تأكيد",
 outT:"تسجيل النتيجة",outS:"سجّل نتيجة التواصل.",
 oRen:"جُدّد",oRef:"رفض",oPos:"أجّل",oNo:"لم يرد",
 lostT:"الزبون وقّع مع مزوّد آخر",lostS:"يعود الزبون تلقائياً إلى الطابور في دورته القادمة.",
 lostP:"المزوّد الجديد",dur:"المدة (أشهر)",
 fupT:"موعد المتابعة",fupS:"متى نعاود التواصل؟",fupD:"التاريخ",fupN:"ملاحظة",
 q3:"بعد 3 أيام",q7:"بعد أسبوع",q14:"بعد أسبوعين",q30:"بعد شهر",fupClear:"حذف",
 contracts:"العقود",activity:"سجل التواصل",docsT:"الملفات",storageUsed:"المساحة المستخدمة",txtData:"نصوص",filesData:"ملفات",totalStorT:"إجمالي المساحة المستخدمة",allCustStor:"كل الزبائن",cross:"البيع المتقاطع",hh:"نفس العنوان",
 noDoc:"لا ملفات",noAct:"لا يوجد تواصل",noFile:"لا يوجد ملف عقد مرفق",
 editC:"تعديل بيانات التواصل",moveT:"تسجيل انتقال",
 delCust:"حذف الزبون",delContr:"حذف العقد",
 delCustQ:"هل تريد حذف هذا الزبون نهائيًا مع كل عقوده وملفاته وسجل تواصله؟ لا يمكن التراجع عن هذا الإجراء.",
 delContrQ:"هل تريد حذف هذا العقد نهائيًا مع ملفاته؟ لا يمكن التراجع عن هذا الإجراء.",
 delType:"اكتب «حذف» للتأكيد",delWord:"حذف",deleted:"تم الحذف",delCancel:"إلغاء",delConfirm:"حذف نهائي",
 moveS:"الانتقال يُنهي عقود الكهرباء والغاز فوراً — ويفتح عقوداً جديدة.",
 moveD:"تاريخ الانتقال",addC:"إضافة عقد",
 wa:"واتساب",em:"بريد",ph:"هاتف",callS:"اطلب هذا الرقم من جوالك.",
 copy:"نسخ",copied:"تم النسخ",openWa:"فتح في واتساب",openMail:"كتابة بريد",
 msgT:"نص الرسالة الجاهز",subj:"الموضوع",after:"بعدها سجّل النتيجة",
 tpl:"مرحباً {n}، عقد {s} لديك مع {p} ينتهي بتاريخ {e}، وآخر موعد للإلغاء هو {d}. لديّ عرض أفضل لك — هل نتحدث قليلاً؟",
 tplS:"عقد {s} الخاص بك ينتهي في {e}",
 opsT:"الفرص والنقاط المفتوحة",priceT:"رفع الأسعار",
 priceS:"اختر المزوّد — كل المتأثرين لهم حق إنهاء استثنائي",
 priceR:"حق إنهاء استثنائي",affected:"زبون متأثر",
 noConf:"غير مؤكَّد",lateC:"مضى {n} يوماً بلا رد",
 widT:"مهلة الرجوع سارية",widS:"مهلة الرجوع أربعة عشر يوماً — العقد غير نهائي بعد",
 teamT:"الفريق",invite:"دعوة موظف",owner:"صاحب العمل",agent:"موظف",
 handT:"تسليم الزبائن",handTo:"تسليم إلى",seatFull:"بلغت حد الموظفين",
 inviteOk:"أُنشئت الدعوة. انسخ الرابط وأرسله:",
 setT:"الإعدادات",expT:"تصدير قائمة الزبائن",ownOnly:"لصاحب المكتب فقط",
 expBlk:"التصدير مقفل — صاحب المكتب وحده يستطيع تنزيل قائمة الزبائن",
 logT:"سجل الوصول",dupT:"تكرارات محتملة",noDup:"لا تكرارات",
 usage:"الاستخدام",custs:"زبون",seats:"موظف",mgr:"مدير",emp:"موظف",and:"و",myCust:"زبائني",
 trialN:"نسخة تجريبية — بقي {n} يوماً. كل الميزات مفتوحة.",
 trialEnd:"انتهت الفترة التجريبية.",upgrade:"اشترك",
 saved:"تم الحفظ",added:"تمت الإضافة",done:"تم",err:"خطأ",
 limitCust:"بلغت حد الزبائن — غيّر الباقة",
 lglNote:"مسودة — تحتاج مراجعة محامٍ قبل النشر.",
 ckT:"Cookies und lokale Speicherung",
 ckS:"Wir verwenden technisch notwendige Speichertechnologien, damit die Anwendung funktioniert. Optionale Technologien setzen wir nur mit Ihrer Einwilligung ein.",
 ckNec:"Nur notwendige",ckAll:"Alle akzeptieren",ckMore:"Details",
 searchDocs:"ابحث داخل الملفات…",
 nav2:{camp:"الحملات",inbox:"صندوق الوارد",rep:"التقارير",bill:"الاشتراك"},
 forgot:"نسيت كلمة المرور؟",resetT:"تعيين كلمة مرور جديدة",resetSent:"إن كان البريد معروفاً فقد أُرسلت رسالة.",
 code2fa:"الرمز من التطبيق",twofa:"التحقق بخطوتين",twofaOn:"مفعّل",twofaOff:"غير مفعّل",
 enable:"تفعيل",disable:"إيقاف",scan:"امسح الرمز في تطبيق المصادقة أو أدخل المفتاح:",
 campT:"الحملات",newCamp:"حملة جديدة",chan:"القناة",catT:"نوع الرسالة",
 catU:"خدمية — مرتبطة بعقد قائم",catM:"تسويقية — تحتاج موافقة",
 segT:"الشريحة",segA:"زبائن لا يملكون هذه الخدمة",segB:"زبائن هذا المزوّد",
 segC:"عقود تنتهي خلال 90 يوماً",dlim:"الحد اليومي",recip:"المستقبلون",
 excl:"مستبعد بلا موافقة",daysN:"{n} يوم",optOutT:"يُضاف سطر إيقاف الرسائل تلقائياً",
 sendNow:"إرسال الدفعة الأولى",pauseC:"إيقاف مؤقت",runT:"جارية",doneT:"منتهية",pausedT:"موقوفة",
 sentT:"أُرسلت",autoPause:"أُوقفت تلقائياً — تجاوزت نسبة الفشل 5%",
 waNote:"رسائل واتساب تُجهَّز للإرسال. اربط مزوّداً رسمياً للإرسال التلقائي.",
 inboxT:"صندوق الوارد",connT:"ربط حساب البريد",
 connS:"يعمل مع جيميل وأوتلوك وهوستنجر وأي خادم بريد خاص",
 preset:"المزوّد",imapH:"خادم الاستقبال",portL:"المنفذ",smtpH:"خادم الإرسال",appPw:"كلمة مرور التطبيق",
 conn:"ربط",disc:"فصل",syncT:"جلب الرسائل",notConn:"لا يوجد حساب بريد مرتبط",
 mailOk:"تم ربط حساب البريد بنجاح",
 mailAuthErr:"فشل تسجيل الدخول. مع Gmail/Outlook لازم تستخدم «كلمة مرور التطبيق» مش كلمة السر العادية.",
 mailConnErr:"فشل الاتصال بخادم البريد. تأكد من اسم الخادم والمنفذ.",
 suggT:"عقود مكتشفة",suggS:"لا يُحفظ شيء تلقائياً — أنت تؤكد كل عنصر",
 archiveIt:"أرشفة كعقد",ignoreIt:"تجاهل",matchedT:"مطابق",unmatchedT:"لم يُتعرّف على زبون",
 imported:"تم استيراد {n} رسالة",
 repT:"التقارير",bySrv:"حسب الخدمة",byAgent:"حسب الموظف",byMonth:"العقود المستحقة شهرياً",
 qualT:"جودة البيانات",noEnd:"بلا تاريخ انتهاء",noNotice:"بلا مهلة إنهاء",
 noDocQ:"بلا ملف",unpaidQ:"عمولة معلّقة",
 billT:"الاشتراك",curPlan:"الباقة الحالية",choose:"اختيار",manage:"إدارة الدفع",
 cycMonthly:"شهري",cycYearly:"سنوي",perMo:"/شهر",perYr:"/سنة",yrSave:"شهرين مجانًا",upgrade:"ترقية",
 billOff:"الدفع غير مُعدّ بعد.",
 asstT:"المساعد",asstS:"يكتب الخطابات والرسائل من بيانات هذا الزبون",
 asstAsk:"ماذا تريدني أن أكتب؟",asstPh:"مثال: خطاب إنهاء، حق الرجوع، عرض تجديد…",
 gen:"إنشاء",print:"طباعة",asMail:"فتح كبريد",result:"النتيجة",
 k:{kuendigung:"خطاب إنهاء",widerruf:"حق الرجوع (14 يوماً)",sonderkuendigung:"إنهاء استثنائي",
    umzug:"إبلاغ بالانتقال",verlaengerung:"عرض تجديد",crossselling:"عرض خدمة إضافية",
    unterlagen:"طلب مستندات"},
 servT:"الخدمات",addSrvT:"إضافة",sendersT:"عناوين الإرسال",defA:"افتراضي",
 setDef:"اجعله افتراضياً",companyT:"بيانات الشركة",leadT:"التذكير الافتراضي (أيام)",
 protectT:"الموظف يرى زبائنه فقط",digestT:"ملخص يومي بالبريد"}
};
function t(){return T[L]}
var SERVICES=['electricity','gas','internet','mobile','kfz','health','liability','home','legal','other'];

/* ---------------- helpers ---------------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function $(id){return document.getElementById(id)}
function val(id){var e=$(id);return e?e.value:''}
function setv(id,v){var e=$(id);if(e&&v!=null&&v!=='')e.value=v}
function iso(d){return new Date(d).toISOString().slice(0,10)}
function addD(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x}
function fmt(s){if(!s)return'—';var p=String(s).slice(0,10).split('-');return p[2]+'.'+p[1]+'.'+p[0]}
function fmtBytes(n){
  n = Number(n)||0;
  if(n < 1024) return n+' B';
  if(n < 1024*1024) return (n/1024).toFixed(1)+' KB';
  if(n < 1024*1024*1024) return (n/1024/1024).toFixed(2)+' MB';
  return (n/1024/1024/1024).toFixed(2)+' GB';
}
function digits(s){return String(s||'').replace(/[^0-9]/g,'')}
function ini(a,b){return((a||'?')[0]+(b||'?')[0]).toUpperCase()}
function urg(n){return n<=14?'d-red':n<=45?'d-org':'d-gry'}
function toast(m){var e=$('toast');e.innerHTML='<div class="toast">'+esc(m)+'</div>';
  clearTimeout(window._t);window._t=setTimeout(function(){e.innerHTML=''},2000)}
function closeM(){$('mod').innerHTML=''}
function showM(h){$('mod').innerHTML='<div class="ovl" onclick="if(event.target===this)closeM()">'+h+'</div>'}
function cp(s){navigator.clipboard.writeText(s).then(function(){toast(t().copied)},function(){})}
function svg(n){var p={
 wa:'<path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2z" fill="none" stroke="currentColor" stroke-width="1.7"/>',
 em:'<path d="M3 6h18v12H3z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m3 7 9 6 9-6" fill="none" stroke="currentColor" stroke-width="1.7"/>',
 ph:'<path d="M6 3h3l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v3c0 1-.8 2-2 2A17 17 0 0 1 4 5c0-1.2.8-2 2-2z" fill="none" stroke="currentColor" stroke-width="1.7"/>',
 up:'<path d="M12 16V4m0 0 4 4m-4-4L8 8M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" fill="none" stroke="currentColor" stroke-width="1.7"/>'}[n];
 return '<svg viewBox="0 0 24 24">'+p+'</svg>'}

/* ---------------- api ---------------- */
async function api(path, opts){
  var o = opts || {};
  var init = { method:o.method||'GET', credentials:'same-origin', headers:{} };
  if (o.body instanceof FormData) init.body=o.body;
  else if (o.body){ init.headers['Content-Type']='application/json'; init.body=JSON.stringify(o.body) }
  var r = await fetch('/api'+path, init);
  if (r.status===401){ ME=null; renderAuth(); throw new Error('unauthorized') }
  var ct = r.headers.get('content-type')||'';
  var data = ct.indexOf('json')>=0 ? await r.json() : await r.text();
  if (!r.ok) throw new Error((data && data.error) || 'error');
  return data;
}

/* ---------------- auth screens ---------------- */
function renderAuth(mode){
  $('app').style.display='none';
  var d=t(), m=mode||'login';
  $('auth').style.display='flex';
  $('auth').innerHTML='<div class="lbox"><img src="/logo.png" alt="">'+
    '<p style="color:var(--tx2);font-size:13px;text-align:center;margin-bottom:18px">'+d.tagline+'</p>'+
    (m==='signup'
      ? '<div class="fld"><label>'+d.company+'</label><input id="s_company"></div>'+
        '<div class="fld"><label>'+d.name+'</label><input id="s_name"></div>'
      : '')+
    '<div class="fld"><label>'+d.email+'</label><input id="a_email" dir="ltr" type="email"></div>'+
    '<div class="fld"><label>'+d.pw+'</label><input id="a_pw" dir="ltr" type="password">'+
      (m==='signup'?'<div style="font-size:11.5px;color:var(--tx3);margin-top:4px">'+d.pwHint+'</div>':'')+'</div>'+
    '<button class="btn btn-p" style="width:100%;margin-top:6px" onclick="doAuth(\''+m+'\')">'+
      (m==='signup'?d.signup:d.login)+'</button>'+
    (m==='login'?'<div class="fld" id="codeWrap" style="display:none"><label>'+d.code2fa+
      '</label><input id="a_code" dir="ltr" inputmode="numeric"></div>':'')+
    '<div style="text-align:center;margin-top:14px">'+
      '<button style="font-size:12.5px;color:var(--acc)" onclick="renderAuth(\''+
        (m==='signup'?'login':'signup')+'\')">'+(m==='signup'?d.toLogin:d.toSignup)+'</button></div>'+
    (m==='login'?'<div style="text-align:center;margin-top:8px">'+
      '<button style="font-size:12px;color:var(--tx3)" onclick="doForgot()">'+d.forgot+
      '</button></div>':'')+
    '<div style="text-align:center;margin-top:10px">'+
      '<button style="font-size:12px;color:var(--tx3)" onclick="switchLang()">'+d.other+'</button></div>'+
    '</div>';
  var f=function(e){if(e.key==='Enter')doAuth(m)};
  $('a_email').onkeydown=f; $('a_pw').onkeydown=f;
}
async function doAuth(mode){
  var d=t();
  try{
    if(mode==='signup'){
      await api('/auth/signup',{method:'POST',body:{
        company:val('s_company'),name:val('s_name'),email:val('a_email'),password:val('a_pw')}});
    } else {
      await api('/auth/login',{method:'POST',body:{
        email:val('a_email'), password:val('a_pw'), code:val('a_code')}});
    }
    await boot();
  }catch(e){
    if(e.message==='totp_required'||e.message==='bad_code'){
      var w=$('codeWrap'); if(w){ w.style.display='block'; $('a_code').focus() }
      toast(d.code2fa);
    } else toast(d.err+': '+e.message);
  }
}
async function doForgot(){
  var d=t();
  await api('/auth/forgot',{method:'POST',body:{email:val('a_email')}}).catch(function(){});
  toast(d.resetSent);
}
function renderReset(token){
  var d=t();
  $('app').style.display='none'; $('auth').style.display='flex';
  $('auth').innerHTML='<div class="lbox"><img src="/logo.png" alt="">'+
   '<p style="text-align:center;color:var(--tx2);font-size:13px;margin-bottom:18px">'+d.resetT+'</p>'+
   '<div class="fld"><label>'+d.pw+'</label><input id="rs_pw" type="password" dir="ltr">'+
   '<div style="font-size:11.5px;color:var(--tx3);margin-top:4px">'+d.pwHint+'</div></div>'+
   '<button class="btn btn-p" style="width:100%" onclick="doReset(\''+token+'\')">'+d.save+'</button></div>';
}
async function doReset(token){
  try{ await api('/auth/reset',{method:'POST',body:{token:token,password:val('rs_pw')}});
    history.replaceState({},'','/'); await boot();
  }catch(e){ toast(t().err+': '+e.message) }
}
async function logout(){ await api('/auth/logout',{method:'POST'}); ME=null; renderAuth() }
function switchLang(){ L = L==='de'?'ar':'de'; localStorage.setItem('vm_lang',L); applyDir();
  if(ME) render(); else renderAuth() }
function applyDir(){ document.documentElement.lang=L; document.documentElement.dir = L==='ar'?'rtl':'ltr' }

/* ---------------- shell ---------------- */
async function boot(){
  applyDir();
  try{ ME = await api('/auth/me') }catch(e){ return renderAuth() }
  $('auth').style.display='none'; $('app').style.display='block';
  V='dash'; await render();
}
function isOwner(){ return ME && ME.role==='owner' }

async function render(){
  var d=t();
  $('who').textContent = ME.name + ' · ' + (isOwner()?d.owner:d.agent);
  $('company').textContent = ME.company;
  $('langBtn').textContent = d.other; $('langBtn').onclick = switchLang;
  $('outBtn').textContent = d.logout; $('outBtn').onclick = logout;
  var fb=$('fbLink'); if(fb) fb.textContent = d.fbLink;

  var s = CACHE.stats = await api('/stats').catch(function(){return{}});
  var items = [['dash', (s.urgent||0)+(s.followups||0)], ['cust',0], ['inbox',0], ['docs',0],
               ['ops', (s.unconfirmed||0)], ['camp',0]];
  var admin = isOwner() ? [['rep',0],['team',0],['bill',0],['set',0]] : [['set',0]];
  $('nav').innerHTML =
    '<div class="ngrp">'+d.g1+'</div>'+
    items.map(navBtn).join('')+
    '<div class="ngrp">'+d.g2+'</div>'+
    admin.map(navBtn).join('');

  var views = {dash:vDash, cust:vCust, cdet:vCdet, docs:vDocs, ops:vOps, team:vTeam,
               set:vSet, legal:vLegal, camp:vCamp, inbox:vInbox, rep:vRep, bill:vBill};
  $('main').innerHTML = '<div class="empty">…</div>';
  $('main').innerHTML = await views[V]();
  cookieBanner();
}
function navBtn(k){
  var d=t(), on=(V===k[0])||(k[0]==='cust'&&V==='cdet');
  var label = d.nav[k[0]] || d.nav2[k[0]] || k[0];
  return '<button class="'+(on?'on':'')+'" onclick="go(\''+k[0]+'\')"><span>'+label+
    '</span>'+(k[1]?'<span class="pill num">'+k[1]+'</span>':'')+'</button>';
}
function go(v){ V=v; SEL=null; Q=''; TB='all'; closeM(); closeNav(); render() }
function toggleNav(){
  var s=$('side'), o=$('sideOv'); if(!s) return;
  var open=s.classList.toggle('open');
  if(o) o.classList.toggle('show', open);
}
function closeNav(){
  var s=$('side'), o=$('sideOv');
  if(s) s.classList.remove('open');
  if(o) o.classList.remove('show');
}
function openC(id){ SEL=id; V='cdet'; closeM(); render() }
// typed-confirmation delete modal (requires typing the delete word)
function delConfirmModal(question, onConfirm){
  var d=t();
  showM('<div class="mod"><h3 style="color:var(--red)">'+d.delConfirm+'</h3>'+
    '<p>'+question+'</p>'+
    '<div class="fld"><label>'+d.delType+'</label>'+
    '<input id="del_word" dir="auto" autocomplete="off"></div>'+
    '<div style="display:flex;gap:8px"><button class="btn" style="flex:1" onclick="closeM()">'+
    d.delCancel+'</button><button class="btn" style="flex:1;background:var(--red);color:#fff;border-color:var(--red)" '+
    'onclick="__doDelete()">'+d.delConfirm+'</button></div></div>');
  window.__doDelete = async function(){
    if((val('del_word')||'').trim().toLowerCase() !== d.delWord.toLowerCase()) return;
    closeM();
    try { await onConfirm(); toast(d.deleted); }
    catch(e){ toast(d.err); }
  };
}
function delCustomer(id){
  var d=t();
  delConfirmModal(d.delCustQ, async function(){
    await api('/customers/'+id, {method:'DELETE'});
    go('cust'); // back to the customer list
  });
}
function delCustomerFromList(id){
  var d=t();
  delConfirmModal(d.delCustQ, async function(){
    await api('/customers/'+id, {method:'DELETE'});
    reloadList(); // stay on the list, just refresh it
  });
}
function delContract(id){
  var d=t();
  delConfirmModal(d.delContrQ, async function(){
    await api('/contracts/'+id, {method:'DELETE'});
    render(); // stay on the customer, refresh
  });
}

function banner(){
  var d=t(); if(!ME || ME.trialDaysLeft===null || ME.tenantStatus!=='trial') return '';
  var n=ME.trialDaysLeft;
  return '<div class="trial"><span>'+(n>0?d.trialN.replace('{n}',n):d.trialEnd)+'</span></div>';
}

/* ---------------- dashboard ---------------- */
async function vDash(){
  var d=t(), s=CACHE.stats||{};
  var due = await api('/contracts/due');
  var fups = await api('/contracts/followups');
  CACHE.due = due;
  return banner()+
  '<div class="head"><div><h1>'+d.nav.dash+'</h1><div class="sub">'+esc(ME.company)+'</div></div>'+
  '<button class="btn btn-p" onclick="formContract()">'+svg('up')+d.archT+'</button></div>'+
  '<div class="cards">'+
   card(d.m1, s.urgent||0, 'var(--red)', "go('cust')")+
   card(d.m2, s.in60||0, '', "go('cust')")+
   card(d.m3, s.followups||0, 'var(--pur)', '')+
   card(d.m4, s.customers||0, '', "go('cust')")+
  '</div>'+
  (fups.length ? panel(d.fupOpen, d.fupToday,
     fups.map(function(c){ return fupRow(c) }).join('')) : '')+
  panel(d.prio, d.sortedBy,
    due.length ? due.map(contractRow).join('') : '<div class="empty">'+d.noRes+'</div>');
}
function card(l,v,color,onclick){
  return '<div class="mc"'+(onclick?' onclick="'+onclick+'"':'')+'><div class="l">'+l+
    '</div><div class="v num"'+(color?' style="color:'+color+'"':'')+'>'+v+'</div></div>';
}
function panel(title,hint,body){
  return '<div class="panel"><div class="ph"><h2>'+title+'</h2>'+
    (hint?'<span class="hint">'+hint+'</span>':'')+'</div>'+body+'</div>';
}
function contractRow(c){
  var d=t(), n=c.days_remaining, tag='';
  if(c.follow_up_date) tag='<span class="tag t-pur">'+d.fupT+' <span class="num">'+fmt(c.follow_up_date)+'</span></span>';
  else if(c.submission_status==='rejected') tag='<span class="tag t-red">'+d.subm.rejected+'</span>';
  else if(c.submission_status==='submitted'||c.submission_status==='review')
    tag='<span class="tag t-org">'+d.subm[c.submission_status]+'</span>';
  else if(c.signed_date && (Date.now()-new Date(c.signed_date))/86400000 < 14)
    tag='<span class="tag t-pur">'+d.widT+'</span>';
  return '<div class="row"><div class="days '+urg(n)+'"><b class="num">'+n+'</b><s>'+d.days+'</s></div>'+
   '<div class="info" onclick="openC(\''+c.customer_id+'\')"><b>'+esc(c.first_name+' '+c.last_name)+'</b>'+
   '<small>'+d.srv[c.service_type]+' · '+esc(c.provider_name||'—')+' · '+d.ends+
   ' <span class="num">'+fmt(c.end_date)+'</span></small></div>'+tag+
   '<div class="acts">'+
   '<button class="ib" onclick="contactSheet(\''+c.id+'\',\'whatsapp\')">'+svg('wa')+'</button>'+
   '<button class="ib" onclick="contactSheet(\''+c.id+'\',\'email\')">'+svg('em')+'</button>'+
   '<button class="ib" onclick="contactSheet(\''+c.id+'\',\'phone\')">'+svg('ph')+'</button></div></div>';
}
function fupRow(c){
  var d=t(), over = new Date(c.follow_up_date) < new Date(iso(new Date()));
  return '<div class="row"><div class="av">'+ini(c.first_name,c.last_name)+'</div>'+
   '<div class="info" onclick="openC(\''+c.customer_id+'\')"><b>'+esc(c.first_name+' '+c.last_name)+'</b>'+
   '<small>'+d.srv[c.service_type]+' · '+esc(c.provider_name||'—')+'</small>'+
   (c.follow_up_note?'<small style="color:var(--tx)">“'+esc(c.follow_up_note)+'”</small>':'')+'</div>'+
   '<span class="tag '+(over?'t-red':'t-pur')+'">'+(over?d.overdue:d.fupToday)+
   ' <span class="num">'+fmt(c.follow_up_date)+'</span></span>'+
   '<div class="acts"><button class="ib" onclick="contactSheet(\''+c.id+'\',\'whatsapp\')">'+svg('wa')+'</button>'+
   '<button class="btn btn-sm" onclick="clearFup(\''+c.id+'\')">✓</button></div></div>';
}
async function clearFup(id){ await api('/contracts/'+id+'/followup',{method:'POST',body:{clear:true}});
  toast(t().done); render() }

/* ---------------- customers ---------------- */
async function vCust(){
  var d=t();
  var rows = await api('/customers?q='+encodeURIComponent(Q)+'&tab='+TB);
  var ks=['all','due','renewed','lost'];
  return '<div class="head"><div><h1>'+(isOwner()||!ME.restrictAgents?d.nav.cust:d.myCust)+'</h1>'+
   '<div class="sub"><span class="num">'+rows.length+'</span> '+d.custs+'</div></div>'+
   '<div style="display:flex;gap:7px;flex-wrap:wrap">'+
   (isOwner()
     ? '<a class="btn" href="/api/export.csv">'+d.expT+'</a>'
     : '<button class="btn" disabled title="'+d.ownOnly+'">'+d.expT+'</button>')+
   '<button class="btn btn-p" onclick="formContract()">'+d.addC+'</button></div></div>'+
   (isOwner()?'':'<div class="trial">'+d.expBlk+'</div>')+
   '<div style="margin-bottom:13px"><input id="sq" placeholder="'+d.search+'" value="'+esc(Q)+
     '" oninput="Q=this.value;clearTimeout(window._s);window._s=setTimeout(reloadList,300)"></div>'+
   '<div class="panel"><div class="ph"><div class="tabs">'+
   ks.map(function(k){return '<button class="'+(TB===k?'on':'')+
     '" onclick="TB=\''+k+'\';reloadList()">'+d.tabs[k]+'</button>'}).join('')+'</div></div>'+
   '<div id="clist">'+custList(rows)+'</div></div>';
}
function custList(rows){
  var d=t();
  if(!rows.length) return '<div class="empty">'+d.noRes+'</div>';
  return rows.map(function(u){
    var n = u.next_deadline ? Math.round((new Date(u.next_deadline)-new Date())/86400000) : null;
    return '<div class="row">'+
      (n===null?'<div class="av">'+ini(u.first_name,u.last_name)+'</div>'
        :'<div class="days '+urg(n)+'"><b class="num">'+n+'</b><s>'+d.days+'</s></div>')+
      '<div class="info" onclick="openC(\''+u.id+'\')"><b>'+esc(u.first_name+' '+u.last_name)+'</b>'+
      '<small class="num">'+esc(u.phone||u.email||'')+'</small></div>'+
      '<span class="tag t-gry"><span class="num">'+u.contract_count+'</span> '+d.contracts+'</span>'+
      '<button class="xb" title="'+d.delCust+'" style="color:var(--red);width:30px;height:30px;font-size:15px" '+
      'onclick="event.stopPropagation();delCustomerFromList(\''+u.id+'\')">🗑</button></div>';
  }).join('');
}
async function reloadList(){
  var rows = await api('/customers?q='+encodeURIComponent(Q)+'&tab='+TB);
  var el=$('clist'); if(el) el.innerHTML=custList(rows);
  document.querySelectorAll('.tabs button').forEach(function(b,i){
    b.className = TB===['all','due','renewed','lost'][i] ? 'on' : '' });
}

/* ---------------- customer detail ---------------- */
async function vCdet(){
  var d=t(), x = await api('/customers/'+SEL);
  CACHE.cust = x;
  var u=x.customer;
  var addr=[u.street,[u.postal_code,u.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return '<div class="head"><div><button class="btn btn-sm" onclick="go(\'cust\')">← '+d.back+'</button>'+
   '<h1 style="margin-top:10px">'+esc(u.first_name+' '+u.last_name)+'</h1>'+
   '<div class="sub num">'+esc(u.phone||'')+(u.email?' · '+esc(u.email):'')+'</div></div>'+
   '<div style="display:flex;gap:7px;flex-wrap:wrap">'+
   '<button class="btn btn-p" onclick="ASST=null;openAssistant()">'+d.asstT+'</button>'+
   '<button class="btn" onclick="formMove()">'+d.moveT+'</button>'+
   '<button class="btn" onclick="formContact()">'+d.editC+'</button>'+
   '<button class="btn" style="color:var(--red);border-color:var(--red)" onclick="delCustomer(\''+u.id+'\')">'+d.delCust+'</button>'+
   '<button class="btn btn-p" onclick="formContract(\''+u.id+'\')">'+d.addC+'</button></div></div>'+
   '<div class="grid2"><div>'+
   panel(d.contracts,'', x.contracts.length
     ? x.contracts.map(function(c){ return detailContractRow(c, x.documents) }).join('')
     : '<div class="empty">'+d.noRes+'</div>')+
   panel(d.docsT+' · '+d.storageUsed+': '+fmtBytes(x.storageBytes)+
     ' ('+d.txtData+' '+fmtBytes(x.textBytes)+' + '+d.filesData+' '+fmtBytes(x.filesBytes)+')','',
     x.documents.length
     ? x.documents.map(function(f){ return '<div class="row"><div class="info">'+
        '<b style="word-break:break-all"><a href="/api/documents/'+f.id+'/file" target="_blank">'+
        esc(f.file_name)+'</a></b><small class="num">'+fmt(f.created_at)+
        ' · '+fmtBytes(f.size_bytes)+'</small></div></div>' }).join('')
     : '<div class="empty">'+d.noDoc+'</div>')+
   '</div><div>'+
   '<div class="panel" style="padding:16px">'+
     kv(d.phone,u.phone,'phone')+kv(d.waNum,u.whatsapp,'whatsapp')+kv(d.mail,u.email,'email')+
     '<div class="kv"><span>'+d.addr+'</span><span>'+esc(addr||'—')+'</span></div>'+
   '</div>'+
   (x.household.length ? panel(d.hh,'', x.household.map(function(h){
      return '<div class="row"><div class="av">'+ini(h.first_name,h.last_name)+'</div>'+
        '<div class="info" onclick="openC(\''+h.id+'\')"><b>'+esc(h.first_name+' '+h.last_name)+'</b></div></div>'
    }).join('')) : '')+
   panel(d.cross,'', x.cross.length
     ? '<div style="padding:14px 18px;display:flex;gap:6px;flex-wrap:wrap">'+
        x.cross.slice(0,5).map(function(s){return '<span class="tag t-blue">'+d.srv[s]+'</span>'}).join('')+
        '</div>'
     : '<div class="empty">—</div>')+
   panel(d.activity,'', x.activities.length
     ? x.activities.map(function(a){ return '<div class="log"><b>'+
        ({renewed:d.oRen,refused:d.oRef,postponed:d.oPos,no_answer:d.oNo,pending:'…'}[a.outcome]||a.outcome)+
        '</b>'+(a.note?'<div style="color:var(--tx2)">'+esc(a.note)+'</div>':'')+
        '<small class="num">'+fmt(a.created_at)+'</small></div>' }).join('')
     : '<div class="empty">'+d.noAct+'</div>')+
   '</div></div>';
}
function kv(label,value,field){
  var d=t();
  return '<div class="kv"><span>'+label+'</span><span style="display:flex;gap:6px;align-items:center">'+
    (value?'<span class="num">'+esc(value)+'</span><button class="xb" onclick="delField(\''+field+
      '\')">✕</button>':'<span class="tag t-org">—</span>')+
    '<button class="xb" onclick="formContact()">✎</button></span></div>';
}
async function delField(f){
  var b={}; b[f]='';
  await api('/customers/'+SEL,{method:'PATCH',body:b}); toast(t().saved); render();
}
function detailContractRow(c, docs){
  var d=t(), n=c.days_remaining;
  var doc = docs.filter(function(f){return f.contract_id===c.id})[0];
  return '<div class="row"><div class="days '+urg(n)+'"><b class="num">'+n+'</b><s>'+d.days+'</s></div>'+
   '<div class="info"><b>'+d.srv[c.service_type]+'</b>'+
   '<small>'+esc(c.provider_name||'—')+' · <span class="num">'+esc(c.contract_number||'')+'</span></small>'+
   '<small>'+d.calcL+': <span class="num">'+fmt(c.cancel_deadline)+'</span></small>'+
   '<small>'+(doc
     ? '<a href="/api/documents/'+doc.id+'/file" target="_blank">'+esc(doc.file_name)+'</a>'
     : '<span style="color:var(--org)">'+d.noFile+'</span>')+'</small>'+
   '<div style="margin-top:7px;display:flex;gap:6px;align-items:center;flex-wrap:wrap">'+
   '<select style="width:auto;padding:3px 8px;font-size:11.5px" onchange="setSub(\''+c.id+'\',this.value)">'+
    ['submitted','review','confirmed','rejected'].map(function(k){
      return '<option value="'+k+'"'+(c.submission_status===k?' selected':'')+'>'+d.subm[k]+'</option>'
    }).join('')+'</select>'+
   '<label style="display:inline-flex;align-items:center;gap:5px;margin:0;font-size:11.5px;cursor:pointer">'+
   '<input type="checkbox" style="width:auto"'+(c.commission_received?' checked':'')+
     ' onchange="setPaid(\''+c.id+'\',this.checked)"> Provision</label>'+
   '<button class="btn btn-sm" onclick="formFup(\''+c.id+'\')">'+
     (c.follow_up_date?d.fupT+' '+fmt(c.follow_up_date):d.fupT)+'</button>'+
   '<button class="btn btn-sm" style="color:var(--red);border-color:var(--red)" onclick="delContract(\''+c.id+'\')">'+d.delContr+'</button>'+
   '</div></div>'+
   '<span class="tag '+(c.status==='renewed'?'t-grn':c.status==='lost'?'t-red':'t-gry')+'">'+
     d.st[c.status]+'</span></div>';
}
async function setSub(id,v){ await api('/contracts/'+id,{method:'PATCH',body:{submission_status:v}});
  toast(t().saved); render() }
async function setPaid(id,v){ await api('/contracts/'+id,{method:'PATCH',body:{commission_received:v}});
  toast(t().saved) }

/* ---------------- contact sheet ---------------- */
function findContract(id){
  var list = (CACHE.due||[]).concat((CACHE.cust&&CACHE.cust.contracts)||[]);
  for(var i=0;i<list.length;i++) if(list[i].id===id) return list[i];
  return null;
}
function contactSheet(cid, channel){
  var d=t(), c=findContract(cid); if(!c) return;
  var name=(c.first_name||(CACHE.cust&&CACHE.cust.customer.first_name)||'');
  var last=(c.last_name||(CACHE.cust&&CACHE.cust.customer.last_name)||'');
  var u = CACHE.cust && CACHE.cust.customer.id===c.customer_id ? CACHE.cust.customer : c;
  var msg = d.tpl.replace('{n}',name).replace('{s}',d.srv[c.service_type])
    .replace('{p}',c.provider_name||'').replace('{e}',fmt(c.end_date)).replace('{d}',fmt(c.cancel_deadline));
  var sub = d.tplS.replace('{s}',d.srv[c.service_type]).replace('{e}',fmt(c.end_date));
  var body='';
  if(channel==='phone'){
    body='<p>'+d.callS+'</p><div class="calc" style="text-align:center;padding:18px">'+
      '<div class="num" style="font-size:25px;font-weight:600;color:#1039a8">'+esc(u.phone||'—')+'</div></div>'+
      '<div style="display:flex;gap:8px;margin:12px 0"><button class="btn" style="flex:1" onclick="cp(\''+
      esc(u.phone||'')+'\')">'+d.copy+'</button>'+
      '<a class="btn" style="flex:1" href="tel:'+digits(u.phone)+'">'+d.ph+'</a></div>';
  } else if(channel==='whatsapp'){
    body='<label>'+d.msgT+'</label><textarea id="wt" rows="4">'+esc(msg)+'</textarea>'+
      '<div style="display:flex;gap:8px;margin:12px 0"><button class="btn" style="flex:1" onclick="cp(val(\'wt\'))">'+
      d.copy+'</button><button class="btn btn-p" style="flex:1" onclick="goWa(\''+
      digits(u.whatsapp||u.phone)+'\')">'+d.openWa+'</button></div>';
  } else {
    body='<div class="fld"><label>'+d.subj+'</label><input id="ms" value="'+esc(sub)+'"></div>'+
      '<label>'+d.msgT+'</label><textarea id="mb" rows="4">'+esc(msg)+'</textarea>'+
      '<div style="display:flex;gap:8px;margin:12px 0"><button class="btn" style="flex:1" onclick="cp(\''+
      esc(u.email||'')+'\')">'+d.copy+'</button>'+
      '<button class="btn btn-p" style="flex:1" onclick="goMail(\''+esc(u.email||'')+'\')">'+
      d.openMail+'</button></div>';
  }
  showM('<div class="mod"><h3>'+esc(name+' '+last)+'</h3>'+body+
    '<div style="border-top:1px solid var(--line);padding-top:13px">'+
    '<div style="font-size:12px;color:var(--tx2);margin-bottom:8px">'+d.after+'</div>'+
    '<div style="display:flex;gap:8px"><button class="btn" style="flex:1" onclick="closeM()">'+d.cancel+'</button>'+
    '<button class="btn btn-p" style="flex:1" onclick="formOutcome(\''+cid+'\',\''+channel+'\')">'+
    d.outT+'</button></div></div></div>');
}
function goWa(n){ window.open('https://wa.me/'+n+'?text='+encodeURIComponent(val('wt')),'_blank') }
function goMail(to){ window.open('mailto:'+to+'?subject='+encodeURIComponent(val('ms'))+
  '&body='+encodeURIComponent(val('mb')),'_blank') }

/* ---------------- outcome ---------------- */
function formOutcome(cid, channel){
  var d=t(); window._c=cid; window._ch=channel;
  showM('<div class="mod"><h3>'+d.outT+'</h3><p>'+d.outS+'</p><div class="opts">'+
   '<button onclick="askRenew()">'+d.oRen+'</button>'+
   '<button onclick="askLost()">'+d.oRef+'</button>'+
   '<button onclick="formFup(window._c,true)">'+d.oPos+'</button>'+
   '<button onclick="sendOutcome({outcome:\'no_answer\'})">'+d.oNo+'</button></div>'+
   '<button class="btn" style="width:100%" onclick="closeM()">'+d.cancel+'</button></div>');
}
function askRenew(){
  var d=t();
  showM('<div class="mod"><h3>'+d.oRen+'</h3>'+
   '<div class="fld"><label>'+d.lostP+'</label><input id="r_prov" placeholder="—"></div>'+
   '<div class="fld"><label>'+d.dur+'</label><select id="r_dur"><option>12</option>'+
   '<option selected>24</option><option>36</option></select></div>'+
   '<div style="display:flex;gap:8px"><button class="btn" style="flex:1" onclick="closeM()">'+d.cancel+'</button>'+
   '<button class="btn btn-p" style="flex:1" onclick="sendOutcome({outcome:\'renewed\','+
   'provider_name:val(\'r_prov\'),duration_months:parseInt(val(\'r_dur\'),10)})">'+d.confirm+'</button></div></div>');
}
function askLost(){
  var d=t();
  showM('<div class="mod"><h3>'+d.lostT+'</h3><p>'+d.lostS+'</p>'+
   '<div class="fld"><label>'+d.lostP+'</label><input id="l_prov"></div>'+
   '<div class="fld"><label>'+d.dur+'</label><select id="l_dur"><option>12</option>'+
   '<option selected>24</option><option>36</option></select></div>'+
   '<div style="display:flex;gap:8px"><button class="btn" style="flex:1" onclick="closeM()">'+d.cancel+'</button>'+
   '<button class="btn btn-p" style="flex:1" onclick="sendOutcome({outcome:\'refused\','+
   'new_provider:val(\'l_prov\'),duration_months:parseInt(val(\'l_dur\'),10)})">'+d.confirm+'</button></div></div>');
}
async function sendOutcome(payload){
  payload.channel = window._ch || 'phone';
  try{ await api('/contracts/'+window._c+'/outcome',{method:'POST',body:payload});
    closeM(); toast(t().done); render() }
  catch(e){ toast(t().err+': '+e.message) }
}

/* ---------------- follow up ---------------- */
function formFup(cid, fromOutcome){
  var d=t(); window._c=cid; window._fa=!!fromOutcome;
  showM('<div class="mod"><h3>'+d.fupT+'</h3><p>'+d.fupS+'</p>'+
   '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">'+
   [[3,'q3'],[7,'q7'],[14,'q14'],[30,'q30']].map(function(x){
     return '<button class="btn btn-sm" onclick="setv(\'fd\',\''+iso(addD(new Date(),x[0]))+'\')">'+
       d[x[1]]+'</button>' }).join('')+'</div>'+
   '<div class="fld"><label>'+d.fupD+'</label><input type="date" dir="ltr" id="fd" value="'+
     iso(addD(new Date(),7))+'"></div>'+
   '<div class="fld"><label>'+d.fupN+'</label><textarea id="fn" rows="3"></textarea></div>'+
   '<div style="display:flex;gap:8px"><button class="btn" style="flex:1" onclick="closeM()">'+d.cancel+'</button>'+
   '<button class="btn btn-p" style="flex:1" onclick="saveFup()">'+d.save+'</button></div></div>');
}
async function saveFup(){
  var body = {follow_up_date: val('fd'), follow_up_note: val('fn')};
  if(window._fa){ await sendOutcome({outcome:'postponed', follow_up_date:val('fd'), note:val('fn')}); return }
  await api('/contracts/'+window._c+'/followup',{method:'POST',body:body});
  closeM(); toast(t().saved); render();
}

/* ---------------- archive contract + extraction ---------------- */
var UPLOAD = null;
function formContract(customerId){
  var d=t(); UPLOAD=null; window._fromMail=null;
  var cust = customerId && CACHE.cust && CACHE.cust.customer.id===customerId ? CACHE.cust.customer : null;
  showM('<div class="mod wide"><h3>'+d.archT+'</h3><p>'+d.archS+'</p>'+
   '<input type="file" id="fileIn" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt" style="display:none" onchange="readFile(this)">'+
   '<div class="dz" id="dz" onclick="document.getElementById(\'fileIn\').click()">'+svg('up')+
     '<b>'+d.dzT+'</b><small>'+d.dzS+'</small></div>'+
   '<div class="orsep">'+d.orMan+'</div>'+
   (cust ? '<div class="tag t-blue" style="margin-bottom:12px">'+esc(cust.first_name+' '+cust.last_name)+'</div>'
     : '<div class="grid2">'+
       fld(d.fName,'n1')+fld(d.lName,'n2')+
       fld(d.phone,'n3','ltr')+fld(d.waNum,'n7','ltr')+
       fld(d.mail,'n4','ltr')+fld(d.plz,'n5','ltr')+
       '</div>'+fld(d.street,'n8')+fld(d.city,'n6'))+
   '<div class="grid2">'+
   '<div class="fld"><label>'+d.fSrv+'</label><select id="c1">'+
     SERVICES.map(function(s){return '<option value="'+s+'">'+d.srv[s]+'</option>'}).join('')+'</select></div>'+
   fld(d.fProv,'c2')+
   fld(d.fNum,'c9','ltr')+
   fld(d.fSigned,'c7','ltr','date')+
   fld(d.fStart,'c3','ltr','date')+
   fld(d.fEnd,'c4','ltr','date')+
   fld(d.fNot,'c5','ltr','number')+
   fld(d.fLead,'c6','ltr','number')+
   '</div>'+
   '<div class="calc"><div class="l">'+d.calcL+'</div><div class="v num" id="cOut">—</div></div>'+
   '<div style="display:flex;gap:8px;margin-top:14px">'+
   '<button class="btn" style="flex:1" onclick="closeM()">'+d.cancel+'</button>'+
   '<button class="btn btn-p" style="flex:1" onclick="saveContract('+
     (customerId?"'"+customerId+"'":'null')+')">'+d.archB+'</button></div></div>');
  setv('c5','42'); setv('c6', String(ME.defaultLeadDays||90));
  setv('c7', iso(new Date()));
  ['c4','c5'].forEach(function(id){ $(id).oninput = calcDeadline });
  calcDeadline();
}
function fld(label,id,dir,type,value){
  return '<div class="fld"><label>'+label+'</label><input id="'+id+'"'+
    (dir?' dir="'+dir+'"':'')+(type?' type="'+type+'"':'')+
    (value!==undefined&&value!==null?' value="'+esc(String(value))+'"':'')+'></div>';
}
function calcDeadline(){
  var e=val('c4'), n=parseInt(val('c5')||0,10);
  var o=$('cOut'); if(o) o.textContent = e ? fmt(iso(addD(new Date(e),-n))) : '—';
}
function dzState(cls,title,note){
  var dz=$('dz'); if(!dz) return;
  dz.className='dz'+(cls?' '+cls:''); dz.innerHTML=svg('up')+'<b>'+esc(title)+'</b><small>'+esc(note)+'</small>';
}

function readFile(inp){
  var d=t(), f=inp.files && inp.files[0]; if(!f) return;
  UPLOAD = {file:f, text:''};
  dzState('', f.name, d.reading);
  var ext=(f.name.split('.').pop()||'').toLowerCase();
  if(ext==='pdf') return readPdf(f);
  if(['png','jpg','jpeg','webp'].indexOf(ext)>=0) return readImg(f);
  var r=new FileReader();
  r.onload=function(){ finishRead(r.result) };
  r.onerror=function(){ dzState('bad', f.name, d.readErr) };
  r.readAsText(f);
}
function readPdf(f){
  var d=t();
  if(typeof pdfjsLib==='undefined'){ dzState('bad',f.name,d.readErr); return }
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  var r=new FileReader();
  r.onload=function(){
    pdfjsLib.getDocument({data:new Uint8Array(r.result)}).promise.then(function(pdf){
      var pages=[], n=Math.min(pdf.numPages,5);
      (function next(i){
        if(i>n) return finishRead(pages.join('\n'));
        pdf.getPage(i).then(function(p){return p.getTextContent()}).then(function(tc){
          pages.push(tc.items.map(function(x){return x.str}).join(' ')); next(i+1) });
      })(1);
    }).catch(function(){ dzState('bad',f.name,d.readErr) });
  };
  r.readAsArrayBuffer(f);
}
function readImg(f){
  var d=t();
  if(typeof Tesseract==='undefined'){ dzState('bad',f.name,d.readErr); return }
  dzState('', f.name, d.ocr);
  Tesseract.recognize(f,'deu').then(function(res){ finishRead(res.data.text) })
    .catch(function(){ Tesseract.recognize(f,'eng').then(function(res){ finishRead(res.data.text) })
    .catch(function(){ dzState('bad',f.name,d.readErr) }) });
}
function finishRead(text){
  var d=t(); UPLOAD.text = text || '';
  var p = parseDE(UPLOAD.text), hits = applyParsed(p);
  dzState(hits?'ok':'bad', UPLOAD.file.name,
    hits ? d.found.replace('{n}',hits) : d.nothing);
  calcDeadline();
}
function deDate(s){
  if(!s) return null;
  var m=s.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/);
  if(m){ var y=m[3].length===2?'20'+m[3]:m[3];
    return y+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2) }
  m=s.match(/(\d{4})-(\d{2})-(\d{2})/); return m?m[0]:null;
}
function grab(txt,keys,after){
  for(var i=0;i<keys.length;i++){
    var re=new RegExp(keys[i]+'[^\\n\\r:]{0,20}[:\\s]\\s*('+after+')','i'), m=txt.match(re);
    if(m) return m[1].trim();
  }
  return null;
}
function parseDE(txt){
  var s=String(txt||'').replace(/ /g,' '), o={};
  o.num = grab(s,['Vertragsnummer','Vertragsnr','Vertrags-Nr','Vertragskonto','Kundennummer',
    'Versicherungsschein(?:nummer)?','Policennummer'],'[A-Z0-9][A-Z0-9\\-\\/\\. ]{3,24}');
  o.start = deDate(grab(s,['Vertragsbeginn','Lieferbeginn','Versicherungsbeginn','Beginn','Vertragsstart'],
    '\\d{1,2}[.\\/-]\\d{1,2}[.\\/-]\\d{2,4}'));
  o.end = deDate(grab(s,['Vertragsende','Laufzeitende','Ende der Laufzeit','Ablauf','Ende'],
    '\\d{1,2}[.\\/-]\\d{1,2}[.\\/-]\\d{2,4}'));
  var k = grab(s,['K.ndigungsfrist'],'[^\\n\\r]{1,40}');
  if(k){
    var w=k.match(/(\d+)\s*(Wochen|Woche|Monate|Monat|Tage|Tag)/i);
    if(w){ var n=parseInt(w[1],10), u=w[2].toLowerCase();
      o.notice = u.indexOf('woch')===0 ? n*7 : u.indexOf('monat')===0 ? n*30 : n }
    else if(/drei\s*monat/i.test(k)) o.notice=90;
    else if(/sechs\s*wochen/i.test(k)) o.notice=42;
    else if(/ein(en)?\s*monat/i.test(k)) o.notice=30;
  }
  var lz = s.match(/(?:Laufzeit|Vertragslaufzeit|Mindestlaufzeit)[^\d]{0,20}(\d{1,2})\s*Monate/i);
  if(lz) o.dur = parseInt(lz[1],10);
  if(/\bGas\b|Erdgas/i.test(s)) o.srv='gas';
  if(/Strom|Elektri|kWh|Z.hlernummer/i.test(s)) o.srv = o.srv||'electricity';
  if(/Internet|DSL|Glasfaser|MBit/i.test(s)) o.srv='internet';
  if(/Mobilfunk|Handyvertrag|SIM/i.test(s)) o.srv='mobile';
  if(/Hausrat/i.test(s)) o.srv='home';
  if(/Rechtsschutz/i.test(s)) o.srv='legal';
  if(/Haftpflicht/i.test(s)) o.srv='liability';
  if(/Kranken(versicherung|kasse)|PKV|GKV/i.test(s)) o.srv='health';
  if(/Kfz|KFZ|Fahrzeug/i.test(s)) o.srv='kfz';
  var pv = s.match(/(Vattenfall|E\.?ON|EWE|Yello|LichtBlick|Allianz|HUK-?COBURG|AXA|Vodafone|Telekom|1&1)/i);
  if(pv) o.prov = pv[1];
  var em = s.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/); if(em) o.email=em[0];
  var ph = s.match(/(?:\+49|0049|\b0)[\d][\d\s\/\-()]{6,18}\d/); if(ph) o.phone=ph[0].replace(/\s+/g,' ').trim();
  var pc = s.match(/\b(\d{5})\s+([A-ZÄÖÜ][A-Za-zäöüß\-\.]+(?:\s[A-ZÄÖÜ][A-Za-zäöüß\-\.]+)?)/);
  if(pc){ o.plz=pc[1]; o.city=pc[2] }
  var stt = s.match(/([A-ZÄÖÜ][A-Za-zäöüß\-\.]*(?:stra(?:ß|ss)e|str\.|weg|allee|platz|gasse|ring|damm|ufer))\s*([0-9]{1,4}\s*[a-zA-Z]?)/i);
  if(stt) o.street=(stt[1]+' '+stt[2]).replace(/\s+/g,' ').trim();
  var nm = s.match(/\b(?:Herrn?|Frau)\s+([A-ZÄÖÜ][a-zäöüß\-]+)\s+([A-ZÄÖÜ][a-zäöüß\-]+)/);
  if(nm){ o.fn=nm[1]; o.ln=nm[2] }
  if(o.start && !o.end && o.dur){ var x=new Date(o.start); x.setMonth(x.getMonth()+o.dur); o.end=iso(x) }
  return o;
}
function applyParsed(p){
  var n=0;
  if($('n1')){
    if(p.fn){setv('n1',p.fn);n++} if(p.ln){setv('n2',p.ln);n++}
    if(p.phone){setv('n3',p.phone);setv('n7',p.phone);n++}
    if(p.email){setv('n4',p.email);n++}
    if(p.plz){setv('n5',p.plz);n++} if(p.city){setv('n6',p.city);n++}
    if(p.street){setv('n8',p.street);n++}
  }
  if(p.srv){setv('c1',p.srv);n++}
  if(p.prov){setv('c2',p.prov);n++}
  if(p.num){setv('c9',p.num);n++}
  if(p.start){setv('c3',p.start);n++}
  if(p.end){setv('c4',p.end);n++}
  if(p.notice){setv('c5',p.notice);n++}
  ['c3','c4','c5'].forEach(function(id){
    var e=$(id); if(!e) return;
    var got=(id==='c3'&&p.start)||(id==='c4'&&p.end)||(id==='c5'&&p.notice);
    e.className = got ? '' : 'low';
  });
  return n;
}
async function saveContract(customerId){
  var d=t();
  try{
    var cid = customerId;
    if(!cid){
      var cu = await api('/customers',{method:'POST',body:{
        first_name:val('n1')||'Neu', last_name:val('n2')||'Kunde',
        phone:val('n3'), whatsapp:val('n7')||val('n3'), email:val('n4'),
        street:val('n8'), postal_code:val('n5'), city:val('n6'), marketing_consent:true }});
      cid = cu.id;
    }
    var docId = null;
    if(UPLOAD && UPLOAD.file){
      var fd = new FormData();
      fd.append('file', UPLOAD.file);
      fd.append('customer_id', cid);
      fd.append('extracted_text', UPLOAD.text.slice(0,190000));
      var doc = await api('/documents',{method:'POST',body:fd});
      docId = doc.id;
    }
    var body = {
      customer_id:cid, service_type:val('c1'), provider_name:val('c2'),
      contract_number:val('c9'), signed_date:val('c7'), start_date:val('c3'),
      end_date:val('c4'), notice_period_days:parseInt(val('c5'),10),
      reminder_lead_days:parseInt(val('c6'),10), source_document_id:docId };
    if(window._fromMail){ body.inbox_message_id = window._fromMail }
    await api('/contracts',{method:'POST',body:body});
    window._fromMail = null; MAILS = [];
    closeM(); toast(d.added); SEL=cid; V='cdet'; render();
  }catch(e){
    toast(e.message==='customer_limit_reached' ? d.limitCust : d.err+': '+e.message);
  }
}

/* ---------------- edit contact / move ---------------- */
function formContact(){
  var d=t(), u=CACHE.cust.customer;
  showM('<div class="mod"><h3>'+d.editC+'</h3>'+
   fld(d.phone,'q1','ltr')+fld(d.waNum,'q2','ltr')+fld(d.mail,'q3','ltr')+
   fld(d.street,'q4')+'<div class="grid2">'+fld(d.plz,'q5','ltr')+fld(d.city,'q6')+'</div>'+
   '<div style="display:flex;gap:8px"><button class="btn" style="flex:1" onclick="closeM()">'+d.cancel+'</button>'+
   '<button class="btn btn-p" style="flex:1" onclick="saveContact()">'+d.save+'</button></div></div>');
  setv('q1',u.phone); setv('q2',u.whatsapp); setv('q3',u.email);
  setv('q4',u.street); setv('q5',u.postal_code); setv('q6',u.city);
}
async function saveContact(){
  await api('/customers/'+SEL,{method:'PATCH',body:{
    phone:val('q1'), whatsapp:val('q2'), email:val('q3'),
    street:val('q4'), postal_code:val('q5'), city:val('q6')}});
  closeM(); toast(t().saved); render();
}
function formMove(){
  var d=t(), u=CACHE.cust.customer;
  showM('<div class="mod"><h3>'+d.moveT+'</h3><p>'+d.moveS+'</p>'+
   '<div class="fld"><label>'+d.moveD+'</label><input type="date" dir="ltr" id="m0" value="'+
     iso(new Date())+'"></div>'+
   fld(d.street,'m1')+'<div class="grid2">'+fld(d.plz,'m2','ltr')+fld(d.city,'m3')+'</div>'+
   '<div style="display:flex;gap:8px"><button class="btn" style="flex:1" onclick="closeM()">'+d.cancel+'</button>'+
   '<button class="btn btn-p" style="flex:1" onclick="saveMove()">'+d.confirm+'</button></div></div>');
  setv('m1',u.street); setv('m2',u.postal_code); setv('m3',u.city);
}
async function saveMove(){
  await api('/customers/'+SEL+'/move',{method:'POST',body:{
    moved_at:val('m0'), street:val('m1'), postal_code:val('m2'), city:val('m3')}});
  closeM(); toast(t().saved); render();
}

/* ---------------- opportunities ---------------- */
async function vOps(){
  var d=t();
  var provs = await api('/contracts/providers');
  var pick = CACHE.prov || (provs[0] && provs[0].name) || '';
  CACHE.prov = pick;
  var aff = pick ? await api('/contracts/by-provider/'+encodeURIComponent(pick)) : [];
  var unc = await api('/contracts/unconfirmed');
  var wid = await api('/contracts/withdrawal');
  return '<div class="head"><div><h1>'+d.nav.ops+'</h1><div class="sub">'+d.opsT+'</div></div></div>'+
  panel(d.priceT, d.priceS,
    '<div style="padding:14px 18px" class="grid2">'+
    '<div class="fld" style="margin:0"><label>'+d.fProv+'</label><select onchange="CACHE.prov=this.value;render()">'+
     provs.map(function(p){return '<option'+(p.name===pick?' selected':'')+'>'+esc(p.name)+'</option>'}).join('')+
     '</select></div>'+
    '<div class="calc" style="margin:0"><div class="l">'+d.priceR+'</div>'+
     '<div class="v"><span class="num">'+aff.length+'</span> '+d.affected+'</div></div></div>'+
    (aff.length ? aff.slice(0,10).map(function(c){
      return '<div class="row"><div class="av">'+ini(c.first_name,c.last_name)+'</div>'+
       '<div class="info" onclick="openC(\''+c.customer_id+'\')"><b>'+esc(c.first_name+' '+c.last_name)+
       '</b><small>'+d.srv[c.service_type]+'</small></div>'+
       '<span class="tag t-pur">'+d.priceR+'</span>'+
       '<div class="acts"><button class="ib" onclick="contactSheet(\''+c.id+'\',\'whatsapp\')">'+
       svg('wa')+'</button></div></div>' }).join('') : '<div class="empty">'+d.noRes+'</div>'))+
  panel(d.noConf, '', unc.length ? unc.map(function(c){
     return '<div class="row"><div class="av">'+ini(c.first_name,c.last_name)+'</div>'+
      '<div class="info" onclick="openC(\''+c.customer_id+'\')"><b>'+esc(c.first_name+' '+c.last_name)+
      '</b><small>'+d.srv[c.service_type]+' · '+esc(c.provider_name||'—')+'</small></div>'+
      '<span class="tag '+(c.submission_status==='rejected'||c.days_waiting>21?'t-red':'t-org')+'">'+
      (c.submission_status==='rejected' ? esc(c.rejection_reason||d.subm.rejected)
        : d.lateC.replace('{n}', c.days_waiting==null?0:c.days_waiting))+'</span>'+
      '<div class="acts"><button class="btn btn-sm" onclick="setSub(\''+c.id+'\',\'confirmed\')">✓</button>'+
      '<button class="btn btn-sm" onclick="setSub(\''+c.id+'\',\'rejected\')">✕</button></div></div>'
   }).join('') : '<div class="empty">—</div>')+
  panel(d.widT, d.widS, wid.length ? wid.map(function(c){
     return '<div class="row"><div class="av">'+ini(c.first_name,c.last_name)+'</div>'+
      '<div class="info" onclick="openC(\''+c.customer_id+'\')"><b>'+esc(c.first_name+' '+c.last_name)+
      '</b><small>'+d.srv[c.service_type]+'</small></div>'+
      '<span class="tag t-pur"><span class="num">'+c.days_left+'</span> '+d.days+'</span></div>'
   }).join('') : '<div class="empty">—</div>');
}

/* ---------------- documents ---------------- */
async function vDocs(){
  var d=t();
  var rows = await api('/documents?q='+encodeURIComponent(Q));
  return '<div class="head"><div><h1>'+d.docsT+'</h1></div>'+
   '<button class="btn btn-p" onclick="formContract()">'+svg('up')+d.archT+'</button></div>'+
   '<div style="margin-bottom:13px"><input placeholder="'+d.searchDocs+'" value="'+esc(Q)+
     '" oninput="Q=this.value;clearTimeout(window._s);window._s=setTimeout(render,400)"></div>'+
   '<div class="panel">'+(rows.length ? rows.map(function(f){
     return '<div class="row"><div class="info"><b style="word-break:break-all">'+
       '<a href="/api/documents/'+f.id+'/file" target="_blank">'+esc(f.file_name)+'</a></b>'+
       '<small>'+esc([f.first_name,f.last_name].filter(Boolean).join(' '))+' · <span class="num">'+
       fmt(f.created_at)+'</span></small></div>'+
       (f.customer_id?'<button class="btn btn-sm" onclick="openC(\''+f.customer_id+'\')">'+
         d.nav.cust+'</button>':'')+'</div>' }).join('')
     : '<div class="empty">'+d.noDoc+'</div>')+'</div>';
}

/* ---------------- team ---------------- */
async function vTeam(){
  var d=t();
  var rows = await api('/team');
  var full = rows.length >= ME.maxSeats;
  return '<div class="head"><div><h1>'+d.teamT+'</h1>'+
   '<div class="sub"><span class="num">'+rows.length+' / '+ME.maxSeats+'</span> '+d.seats+'</div></div>'+
   '<div style="display:flex;gap:7px">'+
   '<button class="btn" onclick="formHandover()">'+d.handT+'</button>'+
   '<button class="btn btn-p"'+(full?' disabled':'')+' onclick="formInvite()">'+d.invite+'</button></div></div>'+
   (full?'<div class="trial">'+d.seatFull+'</div>':'')+
   '<div class="panel">'+rows.map(function(u){
     return '<div class="row"><div class="av">'+ini(u.name,u.name.split(' ')[1]||'X')+'</div>'+
      '<div class="info"><b>'+esc(u.name)+'</b><small class="num">'+esc(u.email)+' · '+
      u.customers+' '+d.custs+'</small></div>'+
      '<span class="tag '+(u.role==='owner'?'t-blue':'t-gry')+'">'+
      (u.role==='owner'?d.owner:d.agent)+'</span>'+
      (u.status==='invited'?'<span class="tag t-org">…</span>':'')+
      (u.role==='agent'?'<span class="tag t-org">'+d.ownOnly+' — '+d.expT+'</span>':'')+
      '</div>' }).join('')+'</div>';
}
function formInvite(){
  var d=t();
  showM('<div class="mod"><h3>'+d.invite+'</h3>'+fld(d.name,'i_name')+fld(d.mail,'i_email','ltr')+
   '<div style="display:flex;gap:8px"><button class="btn" style="flex:1" onclick="closeM()">'+d.cancel+'</button>'+
   '<button class="btn btn-p" style="flex:1" onclick="sendInvite()">'+d.confirm+'</button></div></div>');
}
async function sendInvite(){
  var d=t();
  try{
    var r = await api('/team/invite',{method:'POST',body:{name:val('i_name'),email:val('i_email')}});
    showM('<div class="mod"><h3>'+d.invite+'</h3><p>'+d.inviteOk+'</p>'+
      '<input readonly value="'+esc(r.invite_url)+'" dir="ltr">'+
      '<div style="display:flex;gap:8px;margin-top:12px">'+
      '<button class="btn" style="flex:1" onclick="cp(\''+esc(r.invite_url)+'\')">'+d.copy+'</button>'+
      '<button class="btn btn-p" style="flex:1" onclick="closeM();render()">'+d.confirm+'</button></div></div>');
  }catch(e){ toast(e.message==='seat_limit_reached'?d.seatFull:d.err) }
}
async function formHandover(){
  var d=t(), rows = await api('/team');
  var opts = rows.map(function(u){return '<option value="'+u.id+'">'+esc(u.name)+'</option>'}).join('');
  showM('<div class="mod"><h3>'+d.handT+'</h3>'+
   '<div class="fld"><label>'+d.agent+'</label><select id="h1">'+opts+'</select></div>'+
   '<div class="fld"><label>'+d.handTo+'</label><select id="h2">'+opts+'</select></div>'+
   '<div style="display:flex;gap:8px"><button class="btn" style="flex:1" onclick="closeM()">'+d.cancel+'</button>'+
   '<button class="btn btn-p" style="flex:1" onclick="doHandover()">'+d.confirm+'</button></div></div>');
}
async function doHandover(){
  await api('/team/handover',{method:'POST',body:{from_user_id:val('h1'),to_user_id:val('h2')}});
  closeM(); toast(t().saved); render();
}

/* ---------------- settings ---------------- */
async function vSet(){
  var d=t();
  var st = await api('/settings');
  CACHE.settings = st;
  if(!isOwner())
    return '<div class="head"><div><h1>'+d.setT+'</h1></div></div>'+
      '<div class="panel" style="padding:18px">'+
      '<div class="kv"><span>'+d.mail+'</span><span class="num">'+esc(ME.email)+'</span></div>'+
      '<div class="kv"><span>'+d.teamT+'</span><span>'+d.agent+'</span></div></div>'+
      panel(d.twofa,'', '<div style="padding:16px 18px">'+
        '<button class="btn" onclick="setup2fa()">'+d.enable+'</button></div>');

  var dups = await api('/duplicates');
  var log = await api('/access-log');
  var stor = await api('/storage');
  var tn = st.tenant;
  return '<div class="head"><div><h1>'+d.setT+'</h1></div></div>'+
   '<div class="panel" style="padding:18px;margin-bottom:16px">'+
     '<div class="kv"><span><b>'+d.totalStorT+'</b> ('+d.allCustStor+': '+
       '<span class="num">'+stor.customers+'</span>)</span>'+
       '<span class="num"><b>'+fmtBytes(stor.total)+'</b></span></div>'+
     '<div class="kv"><span>'+d.txtData+'</span><span class="num">'+fmtBytes(stor.text)+'</span></div>'+
     '<div class="kv"><span>'+d.filesData+'</span><span class="num">'+fmtBytes(stor.files)+'</span></div>'+
   '</div>'+
   '<div class="grid2"><div>'+
   panel(d.companyT,'', '<div style="padding:16px 18px">'+
     fld(d.company,'sg_name',null,null,tn.company_name)+fld(d.street,'sg_street',null,null,tn.street)+
     '<div class="grid2">'+fld(d.plz,'sg_plz','ltr',null,tn.postal_code)+fld(d.city,'sg_city',null,null,tn.city)+'</div>'+
     fld(d.phone,'sg_phone','ltr',null,tn.phone)+
     fld(d.leadT,'sg_lead','ltr','number',tn.default_lead_days)+
     '<label style="display:flex;align-items:center;gap:9px;margin:10px 0;cursor:pointer;font-size:13px">'+
     '<input type="checkbox" id="sg_prot" style="width:auto"'+(tn.restrict_agents?' checked':'')+'> '+
     d.protectT+'</label>'+
     '<label style="display:flex;align-items:center;gap:9px;margin-bottom:12px;cursor:pointer;font-size:13px">'+
     '<input type="checkbox" id="sg_dig" style="width:auto"'+(tn.digest_enabled?' checked':'')+'> '+
     d.digestT+'</label>'+
     '<button class="btn btn-p" style="width:100%" onclick="saveSettings()">'+d.save+'</button></div>')+
   panel(d.servT,'', '<div style="padding:14px 18px;display:flex;gap:6px;flex-wrap:wrap">'+
     (tn.services||[]).map(function(x,i){
       return '<span class="tag t-blue" style="display:inline-flex;align-items:center;gap:6px">'+
        (d.srv[x]||x)+'<button class="xb" style="width:17px;height:17px;border:none;background:transparent"'+
        ' onclick="delService('+i+')">✕</button></span>' }).join('')+'</div>'+
     '<div style="padding:0 18px 16px;display:flex;gap:7px">'+
     '<input id="sv_new" placeholder="'+d.addSrvT+'" style="flex:1">'+
     '<button class="btn btn-sm" onclick="addService()">+</button></div>')+
   panel(d.twofa,'', '<div style="padding:16px 18px">'+
     '<button class="btn" onclick="setup2fa()">'+d.enable+'</button>'+
     '<button class="btn" style="margin-inline-start:8px" onclick="off2fa()">'+d.disable+'</button></div>')+
   '</div><div>'+
   panel(d.sendersT,'', (st.senders.length ? st.senders.map(function(x){
      return '<div class="row"><div class="info"><b class="num">'+esc(x.email)+'</b></div>'+
       (x.is_default?'<span class="tag t-grn">'+d.defA+'</span>'
         :'<button class="btn btn-sm" onclick="defSender(\''+x.id+'\')">'+d.setDef+'</button>')+
       '<button class="xb" onclick="delSender(\''+x.id+'\')">✕</button></div>' }).join('') : '')+
     '<div style="padding:14px 18px;display:flex;gap:7px">'+
     '<input id="sn_new" dir="ltr" placeholder="name@firma.de" style="flex:1">'+
     '<button class="btn btn-sm" onclick="addSender()">+</button></div>')+
   panel(d.dupT,'', dups.length ? dups.map(function(x){
     return '<div class="row"><div class="info"><b>'+esc(x.a_fn+' '+x.a_ln)+' ↔ '+esc(x.b_fn+' '+x.b_ln)+
      '</b><small class="num">'+esc(x.a_phone||'—')+' · '+esc(x.b_phone||'—')+'</small></div>'+
      '<span class="tag t-org">'+(x.reason==='phone'?d.phone:d.fName)+'</span></div>'
    }).join('') : '<div class="empty">'+d.noDup+'</div>')+
   panel(d.logT,'', log.length ? log.map(function(x){
     return '<div class="log"><b>'+esc(x.user_name||'—')+' — '+esc(x.action)+
      ' (<span class="num">'+(x.row_count||0)+'</span>)</b>'+
      '<small class="num">'+new Date(x.created_at).toLocaleString()+'</small></div>'
    }).join('') : '<div class="empty">—</div>')+
   '</div></div>';
}
async function saveSettings(){
  await api('/settings',{method:'PATCH',body:{
    company_name:val('sg_name'), street:val('sg_street'), postal_code:val('sg_plz'),
    city:val('sg_city'), phone:val('sg_phone'),
    default_lead_days:parseInt(val('sg_lead'),10)||90,
    restrict_agents:$('sg_prot').checked, digest_enabled:$('sg_dig').checked}});
  ME = await api('/auth/me'); toast(t().saved); render();
}
async function addService(){
  var v=val('sv_new').trim(); if(!v) return;
  var list=(CACHE.settings.tenant.services||[]).concat([v]);
  await api('/settings',{method:'PATCH',body:{services:list}}); toast(t().added); render();
}
async function delService(i){
  var list=(CACHE.settings.tenant.services||[]).slice(); list.splice(i,1);
  if(!list.length) return;
  await api('/settings',{method:'PATCH',body:{services:list}}); render();
}
async function addSender(){
  var v=val('sn_new').trim(); if(!v) return;
  await api('/settings/senders',{method:'POST',body:{email:v}}); toast(t().added); render();
}
async function defSender(id){ await api('/settings/senders/'+id+'/default',{method:'POST'}); render() }
async function delSender(id){ await api('/settings/senders/'+id,{method:'DELETE'}); render() }
async function setup2fa(){
  var d=t();
  var r = await api('/auth/totp/setup',{method:'POST'});
  showM('<div class="mod"><h3>'+d.twofa+'</h3><p>'+d.scan+'</p>'+
   '<div id="tf_qr" style="display:flex;justify-content:center;margin:12px 0"></div>'+
   '<div class="calc" style="word-break:break-all;font-family:monospace;font-size:12.5px">'+
   esc(r.secret)+'</div>'+
   '<div class="fld" style="margin-top:12px"><label>'+d.code2fa+'</label>'+
   '<input id="tf_code" dir="ltr" inputmode="numeric"></div>'+
   '<div style="display:flex;gap:8px"><button class="btn" style="flex:1" onclick="closeM()">'+d.cancel+
   '</button><button class="btn btn-p" style="flex:1" onclick="enable2fa()">'+d.enable+'</button></div></div>');
  drawQR(r.otpauth);
}
function drawQR(otpauth){
  if(!otpauth) return;
  var box=$('tf_qr'); if(!box) return;
  function make(){
    try{
      box.innerHTML='';
      new QRCode(box,{text:otpauth,width:180,height:180,
        colorDark:'#000',colorLight:'#fff'});
    }catch(e){}
  }
  if(window.QRCode){ make(); return; }
  var s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
  s.onload=make; document.head.appendChild(s);
}
async function enable2fa(){
  try{ await api('/auth/totp/enable',{method:'POST',body:{code:val('tf_code')}});
    closeM(); toast(t().twofaOn) }
  catch(e){ toast(t().err) }
}
async function off2fa(){ await api('/auth/totp/disable',{method:'POST'}); toast(t().twofaOff) }

/* ---------------- legal + cookies ---------------- */
var LTAB='imp';
function Legal(k){ LTAB=k; V='legal'; closeM(); render() }
function feedbackModal(){
  var d=t();
  showM('<div class="mod"><h3>'+d.fbTitle+'</h3><p>'+d.fbHint+'</p>'+
    '<div class="fld"><textarea id="fb_msg" rows="5" style="width:100%;resize:vertical"></textarea></div>'+
    '<div style="display:flex;gap:8px"><button class="btn" style="flex:1" onclick="closeM()">'+d.delCancel+
    '</button><button class="btn btn-p" style="flex:1" onclick="sendFeedback()">'+d.fbSend+'</button></div></div>');
}
async function sendFeedback(){
  var d=t(), msg=(val('fb_msg')||'').trim();
  if(!msg) return;
  try{
    await api('/feedback',{method:'POST',body:{message:msg}});
    closeM(); toast(d.fbOk);
  }catch(e){
    toast(e.message==='feedback_not_configured' ? d.fbOff : d.err);
  }
}
function P(x){ return '<span class="phx">'+x+'</span>' }
async function vLegal(){
  var d=t(), titles={imp:'Impressum',dsg:'Datenschutzerklärung',agb:'AGB'};
  var body = LTAB==='imp' ? LIMP() : LTAB==='dsg' ? LDSG() : LAGB();
  return '<div class="head"><div><h1>'+titles[LTAB]+'</h1><div class="sub">'+d.lglNote+'</div></div>'+
   '<button class="btn" onclick="go(\'dash\')">'+d.back+'</button></div>'+
   '<div class="panel"><div class="ph"><div class="tabs">'+
   ['imp','dsg','agb'].map(function(k){return '<button class="'+(LTAB===k?'on':'')+
     '" onclick="Legal(\''+k+'\')">'+titles[k]+'</button>'}).join('')+'</div></div>'+
   '<div class="legal" dir="ltr" style="text-align:left;padding:22px 26px">'+body+'</div></div>';
}
function LIMP(){return '<h2>Angaben gemäß § 5 DDG</h2><p>'+P('[Firmenname GmbH]')+'<br>'+
 P('[Straße und Hausnummer]')+'<br>'+P('[PLZ Ort]')+'<br>Deutschland</p>'+
 '<h3>Vertreten durch</h3><p>'+P('[Geschäftsführer]')+'</p>'+
 '<h3>Kontakt</h3><p>Telefon: '+P('[+49 …]')+'<br>E-Mail: '+P('[info@…]')+'</p>'+
 '<h3>Registereintrag</h3><p>Registergericht: '+P('[Amtsgericht …]')+'<br>Registernummer: '+P('[HRB …]')+'</p>'+
 '<h3>Umsatzsteuer-ID</h3><p>Gemäß § 27 a UStG: '+P('[DE …]')+'</p>'+
 '<h3>Verantwortlich nach § 18 Abs. 2 MStV</h3><p>'+P('[Name, Anschrift]')+'</p>'+
 '<h3>EU-Streitschlichtung</h3><p>Plattform der EU-Kommission zur Online-Streitbeilegung: '+
 'https://ec.europa.eu/consumers/odr/</p>'+
 '<h3>Verbraucherstreitbeilegung</h3><p>Wir sind nicht bereit und nicht verpflichtet, an '+
 'Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>'}
function LDSG(){return '<h2>1. Verantwortlicher</h2><p>'+P('[Firmenname GmbH]')+', '+P('[Anschrift]')+
 ', E-Mail: '+P('[info@…]')+'</p>'+
 '<h2>2. Zwecke und Rechtsgrundlagen</h2><p>Wir verarbeiten personenbezogene Daten, um unsere Software '+
 'als Dienstleistung bereitzustellen. Rechtsgrundlagen sind Art. 6 Abs. 1 lit. b, c, f und a DSGVO.</p>'+
 '<h2>3. Verarbeitung im Auftrag unserer Kunden</h2><p>Soweit unsere Kunden über den Dienst '+
 'personenbezogene Daten ihrer eigenen Kundinnen und Kunden verarbeiten, sind sie Verantwortliche. '+
 'Wir handeln insoweit als Auftragsverarbeiter nach Art. 28 DSGVO auf Grundlage eines gesonderten AVV.</p>'+
 '<h2>4. Kategorien von Daten</h2><ul><li>Bestandsdaten</li><li>Kontaktdaten</li>'+
 '<li>Vertragsdaten (Laufzeiten, Kündigungsfristen, Dokumente)</li><li>Nutzungs- und Protokolldaten</li></ul>'+
 '<h2>5. Hosting</h2><p>Betrieb bei '+P('[Hosting-Anbieter]')+', Serverstandort '+P('[EU]')+
 '. Mit dem Anbieter besteht ein Auftragsverarbeitungsvertrag nach Art. 28 DSGVO.</p>'+
 '<h2>6. Server-Logfiles</h2><p>Beim Aufruf werden Browsertyp, Betriebssystem, Referrer, Uhrzeit und '+
 'IP-Adresse verarbeitet (Art. 6 Abs. 1 lit. f DSGVO). Löschung nach '+P('[7/30]')+' Tagen.</p>'+
 '<h2>7. Cookies und lokale Speicherung</h2><p>Technisch notwendige Speichertechnologien sind nach '+
 '§ 25 Abs. 2 TDDDG einwilligungsfrei. Alles Weitere nur mit Einwilligung nach § 25 Abs. 1 TDDDG, '+
 'jederzeit widerrufbar.</p>'+
 '<h2>8. Empfänger</h2><p>'+P('[Auftragsverarbeiter mit Name und Sitz]')+'</p>'+
 '<h2>9. Drittlandtransfer</h2><p>'+P('[Angaben oder: findet nicht statt]')+'</p>'+
 '<h2>10. Speicherdauer</h2><p>Nur solange erforderlich; danach Löschung, soweit keine handels- oder '+
 'steuerrechtlichen Aufbewahrungspflichten bestehen.</p>'+
 '<h2>11. Ihre Rechte</h2><p>Auskunft (Art. 15), Berichtigung (16), Löschung (17), Einschränkung (18), '+
 'Datenübertragbarkeit (20), Widerspruch (21). Beschwerderecht bei '+P('[Aufsichtsbehörde]')+'.</p>'}
function LAGB(){return '<h2>§ 1 Geltungsbereich</h2><p>(1) Diese AGB gelten für Verträge über die Nutzung '+
 'der Software '+P('[Produktname]')+' zwischen '+P('[Firmenname GmbH]')+' und dem Kunden.</p>'+
 '<p>(2) Der Dienst richtet sich ausschließlich an Unternehmer im Sinne des § 14 BGB.</p>'+
 '<h2>§ 2 Vertragsgegenstand</h2><p>Bereitstellung der Software über das Internet (Software as a Service). '+
 'Eine Überlassung des Quellcodes erfolgt nicht.</p>'+
 '<h2>§ 3 Testphase</h2><p>Kostenlose Testphase von '+P('[15]')+' Tagen. Sie endet automatisch und geht '+
 'nicht in ein kostenpflichtiges Abonnement über.</p>'+
 '<h2>§ 4 Preise und Zahlung</h2><p>(1) Preise zuzüglich gesetzlicher Umsatzsteuer, monatlich im Voraus.</p>'+
 '<p>(2) Entgelte für Nachrichtenversand über Messaging-Anbieter sind nicht enthalten und werden '+
 'unmittelbar zwischen Kunde und Anbieter abgerechnet.</p>'+
 '<h2>§ 5 Laufzeit</h2><p>Unbestimmte Zeit, kündbar mit '+P('[30]')+' Tagen zum Monatsende in Textform.</p>'+
 '<h2>§ 6 Verfügbarkeit</h2><p>'+P('[99]')+' % im Jahresmittel, ausgenommen angekündigte Wartung und '+
 'nicht zu vertretende Ausfälle.</p>'+
 '<h2>§ 7 Pflichten des Kunden</h2><p>Geheimhaltung der Zugangsdaten; Verantwortung für eingestellte '+
 'Inhalte und für das Vorliegen erforderlicher Einwilligungen; Freistellung bei rechtswidriger Nutzung.</p>'+
 '<h2>§ 8 Datenschutz</h2><p>Die Parteien schließen einen Auftragsverarbeitungsvertrag nach Art. 28 DSGVO.</p>'+
 '<h2>§ 9 Datensicherung und Export</h2><p>Regelmäßige Sicherungen; jederzeitiger Export in einem '+
 'gängigen Format; Löschung '+P('[30]')+' Tage nach Vertragsende.</p>'+
 '<h2>§ 10 Haftung</h2><p>(1) Unbeschränkt bei Vorsatz, grober Fahrlässigkeit sowie Verletzung von Leben, '+
 'Körper oder Gesundheit.</p><p>(2) Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten '+
 'begrenzt auf den vertragstypischen, vorhersehbaren Schaden, höchstens die im Vorjahr gezahlte Vergütung.</p>'+
 '<p>(3) Der Dienst dient der Organisation von Vertragsfristen. Für die inhaltliche Richtigkeit '+
 'automatisch ausgelesener Daten wird keine Gewähr übernommen; die Prüfung obliegt dem Kunden.</p>'+
 '<h2>§ 11 Änderungen</h2><p>Änderungen mit sechs Wochen Ankündigung in Textform; Schweigen gilt als '+
 'Zustimmung, worauf gesondert hingewiesen wird.</p>'+
 '<h2>§ 12 Schlussbestimmungen</h2><p>Recht der Bundesrepublik Deutschland; Gerichtsstand '+
 P('[Sitz des Anbieters]')+' bei Kaufleuten.</p>'}

function cookieBanner(){
  var d=t();
  if(localStorage.getItem('vm_ck')){ $('ck').innerHTML=''; return }
  $('ck').innerHTML='<div class="ck"><h4>'+d.ckT+'</h4><p>'+d.ckS+'</p><div class="btns">'+
   '<button class="btn" onclick="ckSet(\'nec\')">'+d.ckNec+'</button>'+
   '<button class="btn" onclick="Legal(\'dsg\')">'+d.ckMore+'</button>'+
   '<button class="btn btn-p" onclick="ckSet(\'all\')">'+d.ckAll+'</button></div></div>';
}
function ckSet(v){ localStorage.setItem('vm_ck',v); $('ck').innerHTML='' }

/* ---------------- invite acceptance + start ---------------- */
async function start(){
  applyDir();
  var m = location.pathname.match(/^\/invite\/([a-f0-9]+)$/i);
  if(m){ return renderInvite(m[1]) }
  var rs = location.pathname.match(/^\/reset\/([a-f0-9]+)$/i);
  if(rs){ return renderReset(rs[1]) }
  try{ await boot() }catch(e){ renderAuth() }
}
function renderInvite(token){
  var d=t();
  $('app').style.display='none'; $('auth').style.display='flex';
  $('auth').innerHTML='<div class="lbox"><img src="/logo.png" alt="">'+
   '<p style="text-align:center;color:var(--tx2);font-size:13px;margin-bottom:18px">'+d.signup+'</p>'+
   '<div class="fld"><label>'+d.pw+'</label><input id="iv_pw" type="password" dir="ltr">'+
   '<div style="font-size:11.5px;color:var(--tx3);margin-top:4px">'+d.pwHint+'</div></div>'+
   '<button class="btn btn-p" style="width:100%" onclick="acceptInvite(\''+token+'\')">'+d.confirm+'</button></div>';
}
async function acceptInvite(token){
  try{ await api('/team/accept',{method:'POST',body:{token:token,password:val('iv_pw')}});
    history.replaceState({}, '', '/'); await boot();
  }catch(e){ toast(t().err+': '+e.message) }
}
start();

/* ---------------- campaigns ---------------- */
var CS = {channel:'whatsapp', category:'utility', seg:'a', service:'gas', provider:'', limit:50};
async function vCamp(){
  var d=t();
  var provs = await api('/contracts/providers');
  if(!CS.provider && provs[0]) CS.provider = provs[0].name;
  var seg = CS.seg==='a' ? {type:'missing_service', service:CS.service}
          : CS.seg==='b' ? {type:'provider', provider:CS.provider}
          : {type:'expiring'};
  var pv = await api('/campaigns/preview',{method:'POST',body:{
    channel:CS.channel, category:CS.category, segment:seg, daily_limit:CS.limit}});
  var list = await api('/campaigns');
  var msg = d.tpl.replace('{n}','{name}').replace('{s}',d.srv[CS.service])
    .replace('{p}','—').replace('{e}','—').replace('{d}','—');
  return '<div class="head"><div><h1>'+d.campT+'</h1><div class="sub">'+d.optOutT+'</div></div></div>'+
   '<div class="cards">'+
   card(d.dlim, pv.daily_limit, '', '')+
   card(d.recip, pv.total, 'var(--acc)', '')+
   card(d.excl, pv.excluded, 'var(--org)', '')+
   card(d.daysN.replace('{n}',''), pv.days, '', '')+'</div>'+
   '<div class="grid3"><div class="panel" style="padding:18px">'+
   '<h2 style="font-size:14px;font-weight:600;margin-bottom:14px">'+d.newCamp+'</h2>'+
   '<div class="grid2">'+
   sel(d.chan,'cs_ch',[['whatsapp','WhatsApp'],['email',d.em]],CS.channel,"CS.channel=this.value;render()")+
   sel(d.catT,'cs_cat',[['utility',d.catU],['marketing',d.catM]],CS.category,"CS.category=this.value;render()")+
   '</div>'+
   sel(d.segT,'cs_seg',[['a',d.segA],['b',d.segB],['c',d.segC]],CS.seg,"CS.seg=this.value;render()")+
   (CS.seg==='a' ? sel(d.fSrv,'cs_srv',SERVICES.map(function(x){return [x,d.srv[x]]}),CS.service,
       "CS.service=this.value;render()") : '')+
   (CS.seg==='b' ? sel(d.fProv,'cs_prov',provs.map(function(p){return [p.name,p.name+' ('+p.n+')']}),
       CS.provider,"CS.provider=this.value;render()") : '')+
   '<div class="fld"><label>'+d.msgT+'</label><textarea id="cs_msg" rows="4">'+esc(msg)+'</textarea></div>'+
   '<div class="fld"><label>'+d.dlim+'</label><input type="number" dir="ltr" value="'+CS.limit+
     '" onchange="CS.limit=parseInt(this.value,10)||50;render()"></div>'+
   (CS.channel==='whatsapp'?'<div class="trial">'+d.waNote+'</div>':'')+
   '<button class="btn btn-p" style="width:100%"'+(pv.total?'':' disabled')+
     ' onclick="createCampaign()">'+d.sendNow+'</button></div>'+
   '<div>'+panel(d.recip,'', pv.sample.length ? pv.sample.map(function(x){
      return '<div class="row"><div class="av">'+ini(x.name,x.name.split(' ')[1]||'')+'</div>'+
       '<div class="info"><b>'+esc(x.name)+'</b><small class="num">'+esc(x.target||'')+
       '</small></div></div>' }).join('') : '<div class="empty">'+d.noRes+'</div>')+
   panel(d.campT,'', list.length ? list.map(function(c){
      var pct = c.total_count ? Math.round(c.sent_count/c.total_count*100) : 0;
      return '<div style="padding:13px 18px;border-bottom:1px solid var(--line)">'+
       '<div style="display:flex;justify-content:space-between;gap:8px">'+
       '<b style="font-size:13.5px">'+esc(c.name)+'</b><span class="tag '+
       (c.status==='completed'?'t-grn':c.status==='paused'?'t-red':'t-org')+'">'+
       (c.status==='completed'?d.doneT:c.status==='paused'?d.pausedT:d.runT)+'</span></div>'+
       '<small style="color:var(--tx2);font-size:12px">'+(c.channel==='email'?d.em:'WhatsApp')+
       ' · <span class="num">'+c.sent_count+'/'+c.total_count+'</span> '+d.sentT+'</small>'+
       '<div class="bar" style="height:6px;background:#eaecf0;border-radius:20px;margin-top:6px">'+
       '<div style="height:100%;width:'+pct+'%;background:var(--acc);border-radius:20px"></div></div>'+
       (c.pending?'<button class="btn btn-sm" style="margin-top:8px" onclick="runCampaign(\''+c.id+
         '\')">'+d.sendNow+'</button>':'')+'</div>' }).join('') : '<div class="empty">—</div>')+
   '</div></div>';
}
function sel(label,id,opts,cur,onchange){
  return '<div class="fld"><label>'+label+'</label><select id="'+id+'" onchange="'+onchange+'">'+
    opts.map(function(o){return '<option value="'+esc(o[0])+'"'+(o[0]===cur?' selected':'')+'>'+
      esc(o[1])+'</option>'}).join('')+'</select></div>';
}
async function createCampaign(){
  var d=t();
  var seg = CS.seg==='a' ? {type:'missing_service', service:CS.service}
          : CS.seg==='b' ? {type:'provider', provider:CS.provider}
          : {type:'expiring'};
  try{
    var c = await api('/campaigns',{method:'POST',body:{
      name: CS.seg==='b' ? CS.provider : d.srv[CS.service],
      channel:CS.channel, category:CS.category, segment:seg,
      message_body:val('cs_msg'), daily_limit:CS.limit}});
    await runCampaign(c.id);
  }catch(e){ toast(d.err+': '+e.message) }
}
async function runCampaign(id){
  var d=t();
  var r = await api('/campaigns/'+id+'/run',{method:'POST'});
  toast(r.auto_paused ? d.autoPause : (r.sent+' '+d.sentT));
  render();
}

/* ---------------- inbox ---------------- */
async function vInbox(){
  var d=t();
  var st = await api('/settings');
  if(!st.mail_account){
    return '<div class="head"><div><h1>'+d.inboxT+'</h1><div class="sub">'+d.connS+'</div></div></div>'+
      '<div class="panel"><div class="empty" style="padding:46px 20px">'+d.notConn+'<br><br>'+
      '<button class="btn btn-p" onclick="formConnect()">'+d.conn+'</button></div></div>';
  }
  var msgs = await api('/inbox');
  var sugg = msgs.filter(function(m){ return m.state==='new' && m.has_attachment });
  return '<div class="head"><div><h1>'+d.inboxT+'</h1>'+
   '<div class="sub num">'+esc(st.mail_account.email)+'</div></div>'+
   '<div style="display:flex;gap:7px"><button class="btn" onclick="disconnectMail()">'+d.disc+'</button>'+
   '<button class="btn btn-p" onclick="syncMail()">'+d.syncT+'</button></div></div>'+
   (sugg.length ? panel(d.suggT, d.suggS, sugg.map(function(m){
     return '<div class="row"><div class="av">'+esc((m.from_name||m.from_email||'?').slice(0,2).toUpperCase())+
      '</div><div class="info"><b>'+esc(m.attachment_name||m.subject)+'</b>'+
      '<small>'+esc(m.from_name||m.from_email)+' · '+
      (m.customer_id ? d.matchedT+': '+esc((m.first_name||'')+' '+(m.last_name||'')) : d.unmatchedT)+
      '</small></div>'+
      '<button class="btn btn-sm btn-p" onclick="archiveFromMail(\''+m.id+'\')">'+d.archiveIt+'</button>'+
      '<button class="btn btn-sm" onclick="ignoreMail(\''+m.id+'\')">'+d.ignoreIt+'</button></div>'
    }).join('')) : '')+
   panel(d.inboxT,'', msgs.length ? msgs.map(function(m){
     return '<div class="row"><div class="info" onclick="viewMail(\''+m.id+'\')">'+
      '<b>'+esc(m.from_name||m.from_email||'')+'</b><small>'+esc(m.subject||'')+'</small></div>'+
      (m.has_attachment?'<span class="tag t-gry">'+d.docsT+'</span>':'')+
      '<small style="color:var(--tx3);font-size:11.5px" class="num">'+fmt(m.received_at)+'</small></div>'
    }).join('') : '<div class="empty">'+d.noRes+'</div>');
}
var MAILS = [];
async function viewMail(id){
  var d=t();
  MAILS = MAILS.length ? MAILS : await api('/inbox');
  var m = MAILS.filter(function(x){return x.id===id})[0];
  if(!m){ MAILS = await api('/inbox'); m = MAILS.filter(function(x){return x.id===id})[0] }
  if(!m) return;
  showM('<div class="mod wide"><h3 style="word-break:break-word">'+esc(m.subject||'')+'</h3>'+
   '<p class="num">'+esc(m.from_email||'')+'</p>'+
   '<div style="white-space:pre-wrap;font-size:13px;line-height:1.7;max-height:46vh;overflow:auto;'+
   'background:#f7f8fa;border-radius:10px;padding:14px">'+esc((m.body_text||'').slice(0,8000))+'</div>'+
   '<div style="display:flex;gap:8px;margin-top:14px">'+
   '<button class="btn" style="flex:1" onclick="closeM()">'+d.cancel+'</button>'+
   (m.has_attachment?'<button class="btn btn-p" style="flex:1" onclick="archiveFromMail(\''+m.id+
     '\')">'+d.archiveIt+'</button>':'')+'</div></div>');
}
async function syncMail(){
  var d=t(); toast(d.reading);
  try{ var r = await api('/inbox/sync',{method:'POST'});
    MAILS=[]; toast(d.imported.replace('{n}', r.imported)); render();
  }catch(e){ toast(d.err+': '+e.message) }
}
async function ignoreMail(id){ await api('/inbox/'+id+'/ignore',{method:'POST'}); MAILS=[]; render() }
async function archiveFromMail(id){
  MAILS = await api('/inbox');
  var m = MAILS.filter(function(x){return x.id===id})[0]; if(!m) return;
  closeM();
  formContract(m.customer_id || null);
  setTimeout(function(){
    var p = parseDE(m.body_text||'');
    applyParsed(p);
    dzState('ok', m.attachment_name || m.subject || '—', t().dzOk);
    UPLOAD = null;
    window._fromMail = m.id;
    calcDeadline();
  }, 60);
}
function formConnect(){
  var d=t();
  api('/inbox/presets').then(function(P){
    showM('<div class="mod"><h3>'+d.connT+'</h3><p>'+d.connS+'</p>'+
     '<div class="fld"><label>'+d.preset+'</label><select onchange="applyPreset(this.value)">'+
     '<option value="">—</option>'+Object.keys(P).map(function(k){return '<option>'+k+'</option>'}).join('')+
     '</select></div>'+
     fld(d.mail,'ic_email','ltr')+
     '<div class="grid2">'+fld(d.imapH,'ic_imap','ltr')+fld(d.portL,'ic_ip','ltr')+
     fld(d.smtpH,'ic_smtp','ltr')+fld(d.portL,'ic_sp','ltr')+'</div>'+
     '<div class="fld"><label>'+d.appPw+'</label><input id="ic_pw" type="password" dir="ltr"></div>'+
     '<div style="display:flex;gap:8px"><button class="btn" style="flex:1" onclick="closeM()">'+d.cancel+
     '</button><button class="btn btn-p" style="flex:1" onclick="doConnect()">'+d.conn+'</button></div></div>');
    window._presets = P;
    setv('ic_ip','993'); setv('ic_sp','465');
  });
}
function applyPreset(k){
  var p = window._presets && window._presets[k]; if(!p) return;
  setv('ic_imap',p[0]); setv('ic_ip',p[1]); setv('ic_smtp',p[2]); setv('ic_sp',p[3]);
}
async function doConnect(){
  var d=t();
  try{
    await api('/inbox/connect',{method:'POST',body:{
      email:val('ic_email'), imap_host:val('ic_imap'), imap_port:parseInt(val('ic_ip'),10),
      smtp_host:val('ic_smtp'), smtp_port:parseInt(val('ic_sp'),10), password:val('ic_pw')}});
    closeM(); toast(d.mailOk); render();
  }catch(e){
    var m = e.message==='auth_failed' ? d.mailAuthErr
          : e.message==='imap_connect_failed' ? d.mailConnErr
          : d.err+': '+e.message;
    toast(m);
  }
}
async function disconnectMail(){ await api('/inbox/connect',{method:'DELETE'}); render() }

/* ---------------- assistant ---------------- */
var ASST = null;
function openAssistant(){
  var d=t(), x=CACHE.cust;
  var kinds = ['kuendigung','widerruf','sonderkuendigung','verlaengerung',
               'crossselling','umzug','unterlagen'];
  var contracts = x.contracts || [];
  showM('<div class="mod wide"><h3>'+d.asstT+' — '+esc(x.customer.first_name+' '+x.customer.last_name)+
   '</h3><p>'+d.asstS+'</p>'+
   (contracts.length>1 ? '<div class="fld"><label>'+d.contracts+'</label><select id="as_con">'+
     contracts.map(function(c){return '<option value="'+c.id+'">'+d.srv[c.service_type]+' · '+
       esc(c.provider_name||'—')+'</option>'}).join('')+'</select></div>' : '')+
   '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">'+
   kinds.map(function(k){return '<button class="btn btn-sm" onclick="genLetter(\''+k+'\')">'+
     d.k[k]+'</button>'}).join('')+'</div>'+
   '<div style="display:flex;gap:7px;margin-bottom:12px">'+
   '<input id="as_q" placeholder="'+d.asstPh+'" style="flex:1" '+
   'onkeydown="if(event.key===\'Enter\')genLetter(null)">'+
   '<button class="btn btn-p" onclick="genLetter(null)">'+d.gen+'</button></div>'+
   '<div id="as_out">'+(ASST?asstOut():'<div class="empty">'+d.asstAsk+'</div>')+'</div>'+
   '<button class="btn" style="width:100%;margin-top:10px" onclick="ASST=null;closeM()">'+
   d.cancel+'</button></div>');
}
function asstOut(){
  var d=t();
  return '<div class="fld"><label>'+d.subj+'</label><input id="as_sub" value="'+esc(ASST.subject)+'"></div>'+
   '<div class="fld"><label>'+d.result+'</label><textarea id="as_body" rows="12" '+
   'style="font-family:ui-monospace,monospace;font-size:12.5px;line-height:1.6">'+esc(ASST.body)+
   '</textarea></div><div style="display:flex;gap:7px">'+
   '<button class="btn" style="flex:1" onclick="cp(val(\'as_body\'))">'+d.copy+'</button>'+
   '<button class="btn" style="flex:1" onclick="printLetter()">'+d.print+'</button>'+
   '<button class="btn btn-p" style="flex:1" onclick="mailLetter()">'+d.asMail+'</button></div>';
}
async function genLetter(kind){
  var d=t();
  try{
    ASST = await api('/assistant/generate',{method:'POST',body:{
      customer_id: CACHE.cust.customer.id,
      contract_id: $('as_con') ? val('as_con') : null,
      kind: kind, query: kind ? null : val('as_q')}});
    $('as_out').innerHTML = asstOut();
  }catch(e){ toast(e.message==='no_template' ? d.asstAsk : d.err+': '+e.message) }
}
function printLetter(){
  var w=window.open('','_blank'); if(!w) return;
  w.document.write('<pre style="font:14px/1.75 Arial;white-space:pre-wrap;padding:44px;max-width:720px">'+
    esc(val('as_body'))+'</pre>');
  w.document.close(); w.print();
}
function mailLetter(){
  var u=CACHE.cust.customer;
  window.open('mailto:'+(u.email||'')+'?subject='+encodeURIComponent(val('as_sub'))+
    '&body='+encodeURIComponent(val('as_body')),'_blank');
}

/* ---------------- reports ---------------- */
async function vRep(){
  var d=t(), r = await api('/reports');
  var maxS = Math.max.apply(null, r.byService.map(function(x){return x.n}).concat([1]));
  var maxM = Math.max.apply(null, r.months.map(function(x){return x.n}).concat([1]));
  function bars(rows, label, max){
    return '<div style="padding:16px 18px;display:flex;flex-direction:column;gap:9px">'+
      rows.map(function(x){
        var name = label ? label(x) : x.m;
        return '<div style="display:flex;align-items:center;gap:10px">'+
        '<div style="width:130px;font-size:12.5px;color:var(--tx2)">'+esc(name)+'</div>'+
        '<div style="flex:1;height:24px;background:#f2f4f7;border-radius:6px;overflow:hidden">'+
        '<div style="height:100%;width:'+Math.max(5,Math.round(x.n/max*100))+
        '%;background:var(--acc)"></div></div>'+
        '<div style="width:38px;text-align:end;font-size:12.5px;font-weight:600" class="num">'+
        x.n+'</div></div>' }).join('')+'</div>';
  }
  return '<div class="head"><div><h1>'+d.repT+'</h1></div></div>'+
   '<div class="cards">'+
   card(d.qualT+': '+d.noEnd, r.quality.no_end, r.quality.no_end?'var(--red)':'', '')+
   card(d.qualT+': '+d.noNotice, r.quality.no_notice, r.quality.no_notice?'var(--org)':'', '')+
   card(d.noDocQ, r.quality.no_doc, r.quality.no_doc?'var(--org)':'', '')+
   card(d.unpaidQ, r.quality.unpaid, '', '')+'</div>'+
   '<div class="grid2">'+
   panel(d.bySrv,'', bars(r.byService, function(x){return d.srv[x.service_type]||x.service_type}, maxS))+
   panel(d.byAgent,'', '<div style="padding:16px 18px;display:flex;flex-direction:column;gap:9px">'+
     r.byAgent.map(function(x){
       return '<div style="display:flex;justify-content:space-between;font-size:13px">'+
        '<span>'+esc(x.name)+'</span><span class="num">'+x.n+' · '+x.renewed+' '+
        d.st.renewed+'</span></div>' }).join('')+'</div>')+
   '</div>'+
   panel(d.byMonth,'', r.months.length ? bars(r.months, null, maxM) : '<div class="empty">—</div>');
}

/* ---------------- billing ---------------- */
function seatLabel(seats, d){
  var emp = Math.max(0, (seats||0) - 1);
  // always 1 manager; the remaining seats are employees
  return '<span class="num">1</span> '+d.mgr+
    ' '+d.and+' <span class="num">'+emp+'</span> '+d.emp;
}
var BILL_CYCLE = 'monthly';
function setCycle(c){ BILL_CYCLE = c; render(); }
async function vBill(){
  var d=t(), p = await api('/billing/plans');
  var names = Object.keys(p.plans);
  var yr = BILL_CYCLE === 'yearly';
  var toggle =
   '<div class="cycle-tog">'+
   '<button class="'+(!yr?'on':'')+'" onclick="setCycle(\'monthly\')">'+d.cycMonthly+'</button>'+
   '<button class="'+(yr?'on':'')+'" onclick="setCycle(\'yearly\')">'+d.cycYearly+
     ' <span class="cycle-save">'+d.yrSave+'</span></button></div>';
  return '<div class="head"><div><h1>'+d.billT+'</h1>'+
   '<div class="sub">'+d.curPlan+': '+esc(ME.plan)+'</div></div>'+
   (p.enabled?'<button class="btn" onclick="portal()">'+d.manage+'</button>':'')+'</div>'+
   (p.enabled?'':'<div class="trial">'+d.billOff+'</div>')+
   '<div class="panel" style="padding:18px;max-width:420px;margin-bottom:16px">'+
   '<div class="kv"><span>'+d.custs+'</span><span class="num">'+
     ((ME.usage&&ME.usage.customers)||0)+' / '+ME.maxCustomers+'</span></div>'+
   '<div class="kv"><span>'+d.seats+'</span><span class="num">'+
     ((ME.usage&&ME.usage.seats)||0)+' / '+ME.maxSeats+'</span></div></div>'+
   toggle+
   '<div class="cards">'+names.map(function(n){
     var pl=p.plans[n], cur = ME.plan===n;
     var price = yr ? pl.yearly : pl.monthly;
     var per = yr ? d.perYr : d.perMo;
     return '<div class="mc" style="cursor:default'+(cur?';border:2px solid var(--acc)':'')+'">'+
      '<div class="l" style="text-transform:capitalize;font-size:14px;font-weight:600;color:var(--tx)">'+
      n+'</div><div class="v num">'+price+' €<span style="font-size:13px;color:var(--tx2)"> '+per+'</span></div>'+
      '<div style="font-size:12.5px;color:var(--tx2);margin:8px 0 12px">'+
      '<span class="num">'+pl.customers+'</span> '+d.custs+' · '+seatLabel(pl.seats,d)+'</div>'+
      (cur?'<span class="tag t-blue">'+d.curPlan+'</span>'
        :'<button class="btn btn-sm btn-p" style="width:100%"'+(p.enabled?'':' disabled')+
         ' onclick="checkout(\''+n+'\')">'+d.choose+'</button>')+'</div>' }).join('')+'</div>';
}
async function checkout(plan){
  try{ var r = await api('/billing/checkout',{method:'POST',body:{plan:plan,cycle:BILL_CYCLE}});
    location.href = r.url;
  }catch(e){ toast(t().billOff) }
}
async function portal(){
  try{ var r = await api('/billing/portal',{method:'POST'}); location.href = r.url }
  catch(e){ toast(t().billOff) }
}
