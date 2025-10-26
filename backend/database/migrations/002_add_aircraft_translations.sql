-- ============================================
-- MIGRATION: Add Aircraft Translation Keys
-- Date: 2025-10-26
-- Description: Add missing translation keys for Aircraft pages
-- ============================================

-- English Translations
INSERT INTO translations (id, translation_key, language_code, translation_text, namespace, description) VALUES
-- Aircraft page
(UUID(), 'aircraft.description', 'en', 'Manage your fleet of aircraft', 'aircraft', 'Aircraft page description'),
(UUID(), 'aircraft.noAircraftYet', 'en', 'No aircraft yet', 'aircraft', 'Empty state title'),
(UUID(), 'aircraft.getStarted', 'en', 'Get started by adding your first aircraft.', 'aircraft', 'Empty state description'),
(UUID(), 'aircraft.category', 'en', 'Category', 'aircraft', 'Category column header'),
(UUID(), 'aircraft.organization', 'en', 'Organization', 'aircraft', 'Organization column header'),
(UUID(), 'aircraft.status', 'en', 'Status', 'aircraft', 'Status column header'),
(UUID(), 'aircraft.actions', 'en', 'Actions', 'aircraft', 'Actions column header'),
(UUID(), 'aircraft.personal', 'en', 'Personal', 'aircraft', 'Personal aircraft label'),
(UUID(), 'aircraft.available', 'en', 'Available', 'aircraft', 'Available status'),
(UUID(), 'aircraft.unavailable', 'en', 'Unavailable', 'aircraft', 'Unavailable status'),
(UUID(), 'aircraft.confirmDelete', 'en', 'Are you sure you want to delete this aircraft?', 'aircraft', 'Delete confirmation message'),

-- Aircraft form
(UUID(), 'aircraft.backToAircraft', 'en', 'Back to Aircraft', 'aircraft', 'Back button text'),
(UUID(), 'aircraft.editAircraft', 'en', 'Edit Aircraft', 'aircraft', 'Edit page title'),
(UUID(), 'aircraft.aircraftTypeModel', 'en', 'Aircraft Type / Model', 'aircraft', 'Type field label'),
(UUID(), 'aircraft.typeExample', 'en', 'e.g., Cessna 172 Skyhawk', 'aircraft', 'Type field example'),
(UUID(), 'aircraft.typeHelp', 'en', 'Full aircraft type designation (manufacturer + model + variant)', 'aircraft', 'Type field help text'),
(UUID(), 'aircraft.manufacturer', 'en', 'Manufacturer', 'aircraft', 'Manufacturer field label'),
(UUID(), 'aircraft.model', 'en', 'Model', 'aircraft', 'Model field label'),
(UUID(), 'aircraft.optional', 'en', 'optional', 'aircraft', 'Optional field indicator'),
(UUID(), 'aircraft.yearManufactured', 'en', 'Year Manufactured', 'aircraft', 'Year field label'),
(UUID(), 'aircraft.maxWeight', 'en', 'Max Weight (kg)', 'aircraft', 'Max weight field label'),
(UUID(), 'aircraft.fuelCapacity', 'en', 'Fuel Capacity (liters)', 'aircraft', 'Fuel capacity field label'),
(UUID(), 'aircraft.active', 'en', 'Active', 'aircraft', 'Active checkbox label'),
(UUID(), 'aircraft.availableForUse', 'en', 'Available for Use', 'aircraft', 'Available checkbox label'),
(UUID(), 'aircraft.notes', 'en', 'Notes', 'aircraft', 'Notes field label'),
(UUID(), 'aircraft.notesPlaceholder', 'en', 'Additional information about this aircraft...', 'aircraft', 'Notes placeholder text'),
(UUID(), 'aircraft.manufacturerExample', 'en', 'e.g., Cessna', 'aircraft', 'Manufacturer field example'),
(UUID(), 'aircraft.modelExample', 'en', 'e.g., 172S', 'aircraft', 'Model field example'),
(UUID(), 'aircraft.registrationExample', 'en', 'e.g., N12345', 'aircraft', 'Registration field example'),

-- Category labels
(UUID(), 'aircraft.category.singleEngine', 'en', 'Single Engine', 'aircraft', 'Single engine category'),
(UUID(), 'aircraft.category.multiEngine', 'en', 'Multi Engine', 'aircraft', 'Multi engine category'),
(UUID(), 'aircraft.category.helicopter', 'en', 'Helicopter', 'aircraft', 'Helicopter category'),
(UUID(), 'aircraft.category.glider', 'en', 'Glider', 'aircraft', 'Glider category'),
(UUID(), 'aircraft.category.ultralight', 'en', 'Ultralight', 'aircraft', 'Ultralight category'),

-- Common translations
(UUID(), 'common.saving', 'en', 'Saving...', 'common', 'Saving state'),

-- Settings
(UUID(), 'settings.title', 'en', 'Settings', 'settings', 'Settings page title'),
(UUID(), 'settings.profile', 'en', 'Profile', 'settings', 'Profile section'),
(UUID(), 'settings.changePassword', 'en', 'Change Password', 'settings', 'Change password section'),
(UUID(), 'settings.currentPassword', 'en', 'Current Password', 'settings', 'Current password field'),
(UUID(), 'settings.newPassword', 'en', 'New Password', 'settings', 'New password field'),
(UUID(), 'settings.confirmNewPassword', 'en', 'Confirm New Password', 'settings', 'Confirm new password field'),
(UUID(), 'settings.language', 'en', 'Language', 'settings', 'Language field'),
(UUID(), 'settings.selectLanguage', 'en', 'Select your preferred language', 'settings', 'Language help text'),
(UUID(), 'settings.darkMode', 'en', 'Dark Mode', 'settings', 'Dark mode label'),
(UUID(), 'settings.darkModeDescription', 'en', 'Switch between light and dark theme', 'settings', 'Dark mode description'),
(UUID(), 'settings.passwordChanged', 'en', 'Password changed successfully', 'settings', 'Password change success message'),
(UUID(), 'settings.profileUpdated', 'en', 'Profile updated successfully', 'settings', 'Profile update success message'),
(UUID(), 'common.edit', 'en', 'Edit', 'common', 'Edit button');

-- Dutch Translations
INSERT INTO translations (id, translation_key, language_code, translation_text, namespace, description) VALUES
-- Aircraft page
(UUID(), 'aircraft.description', 'nl', 'Beheer uw vloot vliegtuigen', 'aircraft', 'Vliegtuigen pagina beschrijving'),
(UUID(), 'aircraft.noAircraftYet', 'nl', 'Nog geen vliegtuigen', 'aircraft', 'Lege status titel'),
(UUID(), 'aircraft.getStarted', 'nl', 'Voeg uw eerste vliegtuig toe om te beginnen.', 'aircraft', 'Lege status beschrijving'),
(UUID(), 'aircraft.category', 'nl', 'Categorie', 'aircraft', 'Categorie kolom header'),
(UUID(), 'aircraft.organization', 'nl', 'Organisatie', 'aircraft', 'Organisatie kolom header'),
(UUID(), 'aircraft.status', 'nl', 'Status', 'aircraft', 'Status kolom header'),
(UUID(), 'aircraft.actions', 'nl', 'Acties', 'aircraft', 'Acties kolom header'),
(UUID(), 'aircraft.personal', 'nl', 'Persoonlijk', 'aircraft', 'Persoonlijk vliegtuig label'),
(UUID(), 'aircraft.available', 'nl', 'Beschikbaar', 'aircraft', 'Beschikbaar status'),
(UUID(), 'aircraft.unavailable', 'nl', 'Niet beschikbaar', 'aircraft', 'Niet beschikbaar status'),
(UUID(), 'aircraft.confirmDelete', 'nl', 'Weet u zeker dat u dit vliegtuig wilt verwijderen?', 'aircraft', 'Verwijder bevestiging bericht'),

-- Aircraft form
(UUID(), 'aircraft.backToAircraft', 'nl', 'Terug naar Vliegtuigen', 'aircraft', 'Terug knop tekst'),
(UUID(), 'aircraft.editAircraft', 'nl', 'Vliegtuig Bewerken', 'aircraft', 'Bewerk pagina titel'),
(UUID(), 'aircraft.aircraftTypeModel', 'nl', 'Vliegtuigtype / Model', 'aircraft', 'Type veld label'),
(UUID(), 'aircraft.typeExample', 'nl', 'bijv., Cessna 172 Skyhawk', 'aircraft', 'Type veld voorbeeld'),
(UUID(), 'aircraft.typeHelp', 'nl', 'Volledige vliegtuigtype aanduiding (fabrikant + model + variant)', 'aircraft', 'Type veld hulptekst'),
(UUID(), 'aircraft.manufacturer', 'nl', 'Fabrikant', 'aircraft', 'Fabrikant veld label'),
(UUID(), 'aircraft.model', 'nl', 'Model', 'aircraft', 'Model veld label'),
(UUID(), 'aircraft.optional', 'nl', 'optioneel', 'aircraft', 'Optioneel veld indicator'),
(UUID(), 'aircraft.yearManufactured', 'nl', 'Bouwjaar', 'aircraft', 'Jaar veld label'),
(UUID(), 'aircraft.maxWeight', 'nl', 'Max Gewicht (kg)', 'aircraft', 'Max gewicht veld label'),
(UUID(), 'aircraft.fuelCapacity', 'nl', 'Brandstofcapaciteit (liters)', 'aircraft', 'Brandstofcapaciteit veld label'),
(UUID(), 'aircraft.active', 'nl', 'Actief', 'aircraft', 'Actief checkbox label'),
(UUID(), 'aircraft.availableForUse', 'nl', 'Beschikbaar voor gebruik', 'aircraft', 'Beschikbaar checkbox label'),
(UUID(), 'aircraft.notes', 'nl', 'Notities', 'aircraft', 'Notities veld label'),
(UUID(), 'aircraft.notesPlaceholder', 'nl', 'Aanvullende informatie over dit vliegtuig...', 'aircraft', 'Notities placeholder tekst'),
(UUID(), 'aircraft.manufacturerExample', 'nl', 'bijv., Cessna', 'aircraft', 'Fabrikant veld voorbeeld'),
(UUID(), 'aircraft.modelExample', 'nl', 'bijv., 172S', 'aircraft', 'Model veld voorbeeld'),
(UUID(), 'aircraft.registrationExample', 'nl', 'bijv., PH-ABC', 'aircraft', 'Registratie veld voorbeeld'),

-- Category labels
(UUID(), 'aircraft.category.singleEngine', 'nl', 'Eenmotorig', 'aircraft', 'Eenmotorig categorie'),
(UUID(), 'aircraft.category.multiEngine', 'nl', 'Meermotorig', 'aircraft', 'Meermotorig categorie'),
(UUID(), 'aircraft.category.helicopter', 'nl', 'Helikopter', 'aircraft', 'Helikopter categorie'),
(UUID(), 'aircraft.category.glider', 'nl', 'Zweefvliegtuig', 'aircraft', 'Zweefvliegtuig categorie'),
(UUID(), 'aircraft.category.ultralight', 'nl', 'Ultralight', 'aircraft', 'Ultralight categorie'),

-- Common translations
(UUID(), 'common.saving', 'nl', 'Opslaan...', 'common', 'Opslaan status'),
(UUID(), 'common.edit', 'nl', 'Bewerken', 'common', 'Bewerken knop'),

-- Settings
(UUID(), 'settings.title', 'nl', 'Instellingen', 'settings', 'Instellingen pagina titel'),
(UUID(), 'settings.profile', 'nl', 'Profiel', 'settings', 'Profiel sectie'),
(UUID(), 'settings.changePassword', 'nl', 'Wachtwoord wijzigen', 'settings', 'Wachtwoord wijzigen sectie'),
(UUID(), 'settings.currentPassword', 'nl', 'Huidig Wachtwoord', 'settings', 'Huidig wachtwoord veld'),
(UUID(), 'settings.newPassword', 'nl', 'Nieuw Wachtwoord', 'settings', 'Nieuw wachtwoord veld'),
(UUID(), 'settings.confirmNewPassword', 'nl', 'Bevestig Nieuw Wachtwoord', 'settings', 'Bevestig nieuw wachtwoord veld'),
(UUID(), 'settings.language', 'nl', 'Taal', 'settings', 'Taal veld'),
(UUID(), 'settings.selectLanguage', 'nl', 'Selecteer uw voorkeurstaal', 'settings', 'Taal hulptekst'),
(UUID(), 'settings.darkMode', 'nl', 'Donkere Modus', 'settings', 'Donkere modus label'),
(UUID(), 'settings.darkModeDescription', 'nl', 'Schakel tussen licht en donker thema', 'settings', 'Donkere modus beschrijving'),
(UUID(), 'settings.passwordChanged', 'nl', 'Wachtwoord succesvol gewijzigd', 'settings', 'Wachtwoord wijziging succesbericht'),
(UUID(), 'settings.profileUpdated', 'nl', 'Profiel succesvol bijgewerkt', 'settings', 'Profiel update succesbericht'),

-- Update existing "Luchtvaartuigen" to "Vliegtuigen"
(UUID(), 'aircraft.create', 'nl', 'Vliegtuig Toevoegen', 'aircraft', 'Vliegtuig toevoegen knop'),
(UUID(), 'aircraft.registration', 'nl', 'Registratie', 'aircraft', 'Registratie veld'),
(UUID(), 'aircraft.type', 'nl', 'Type', 'aircraft', 'Type veld');

-- Update the existing aircraft.title to "Vliegtuigen" (needs to be done separately)
UPDATE translations
SET translation_text = 'Vliegtuigen'
WHERE translation_key = 'aircraft.title' AND language_code = 'nl';

-- ============================================
-- END OF MIGRATION
-- ============================================
