import type { Language } from './types';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  uz: {
    // Navigation
    'nav.dashboard': 'Boshqaruv paneli',
    'nav.kds': 'Oshxona ekrani',
    'nav.menu': 'Taomnoma',
    'nav.orders': 'Buyurtmalar',
    'nav.dispatch': 'Yetkazib berish',
    'nav.customers': 'Mijozlar',
    'nav.analytics': 'Tahlil & Statistika',
    'nav.settings': 'Sozlamalar',
    'nav.sign_out': 'Chiqish',
    'nav.connected': 'Ulandi',
    'nav.live': 'JONLI',

    // Common Actions
    'action.save': 'Saqlash',
    'action.cancel': 'Bekor qilish',
    'action.delete': 'Oʻchirish',
    'action.edit': 'Tahrirlash',
    'action.add': 'Qoʻshish',
    'action.refresh': 'Yangilash',
    'action.export': 'Yuklab olish',
    'action.search': 'Qidirish...',
    'action.filter': 'Filtr',

    // Statuses
    'status.confirmed': 'Yangi',
    'status.preparing': 'Tayyorlanmoqda',
    'status.ready': 'Tayyor',
    'status.dispatched': 'Yuborildi',
    'status.delivering': 'Yetkazilmoqda',
    'status.picked_up': 'Olib ketildi',
    'status.completed': 'Bajarildi',
    'status.cancelled': 'Bekor qilindi',
    'status.rejected': 'Rad etildi',

    // Stock
    'stock.in_stock': 'Mavjud',
    'stock.out_of_stock': 'Tugagan',

    // Header
    'header.main_branch': 'Asosiy filial',
    'header.notifications': 'Bildirishnomalar',
  },

  ru: {
    // Navigation
    'nav.dashboard': 'Панель управления',
    'nav.kds': 'Кухонный экран',
    'nav.menu': 'Меню',
    'nav.orders': 'Заказы',
    'nav.dispatch': 'Доставка',
    'nav.customers': 'Клиенты CRM',
    'nav.analytics': 'Аналитика',
    'nav.settings': 'Настройки',
    'nav.sign_out': 'Выйти',
    'nav.connected': 'Подключено',
    'nav.live': 'LIVE',

    // Common Actions
    'action.save': 'Сохранить',
    'action.cancel': 'Отмена',
    'action.delete': 'Удалить',
    'action.edit': 'Редактировать',
    'action.add': 'Добавить',
    'action.refresh': 'Обновить',
    'action.export': 'Экспорт',
    'action.search': 'Поиск...',
    'action.filter': 'Фильтр',

    // Statuses
    'status.confirmed': 'Новый',
    'status.preparing': 'Готовится',
    'status.ready': 'Готово',
    'status.dispatched': 'Отправлен',
    'status.delivering': 'В пути',
    'status.picked_up': 'Забран',
    'status.completed': 'Завершён',
    'status.cancelled': 'Отменён',
    'status.rejected': 'Отклонён',

    // Stock
    'stock.in_stock': 'В наличии',
    'stock.out_of_stock': 'Нет в наличии',

    // Header
    'header.main_branch': 'Главный филиал',
    'header.notifications': 'Уведомления',
  },

  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.kds': 'Kitchen Display',
    'nav.menu': 'Menu Management',
    'nav.orders': 'Order History',
    'nav.dispatch': 'Fleet Dispatch',
    'nav.customers': 'Customers CRM',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    'nav.sign_out': 'Sign Out',
    'nav.connected': 'Connected',
    'nav.live': 'LIVE',

    // Common Actions
    'action.save': 'Save Changes',
    'action.cancel': 'Cancel',
    'action.delete': 'Delete',
    'action.edit': 'Edit',
    'action.add': 'Add Dish',
    'action.refresh': 'Refresh',
    'action.export': 'Export',
    'action.search': 'Search...',
    'action.filter': 'Filter',

    // Statuses
    'status.confirmed': 'New',
    'status.preparing': 'Preparing',
    'status.ready': 'Ready',
    'status.dispatched': 'Dispatched',
    'status.delivering': 'Delivering',
    'status.picked_up': 'Picked Up',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
    'status.rejected': 'Rejected',

    // Stock
    'stock.in_stock': 'In Stock',
    'stock.out_of_stock': 'Out of Stock',

    // Header
    'header.main_branch': 'Main Branch',
    'header.notifications': 'Notifications',
  },
};
