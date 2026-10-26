import type { Language } from './types';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  uz: {
    // Navigation
    'nav.dashboard': 'Boshqaruv paneli',
    'nav.website': 'Veb-sayt yaratuvchi',
    'nav.agents': 'AI Agentlar',
    'nav.voice': 'Ovozli buyurtmalar',
    'nav.kds': 'Oshxona ekrani',
    'nav.menu': 'Taomnoma',
    'nav.orders': 'Buyurtmalar',
    'nav.reservations': 'Band qilishlar',
    'nav.dispatch': 'Yetkazib berish',
    'nav.customers': 'Mijozlar CRM',
    'nav.marketing': 'Marketing & Aksiya',
    'nav.analytics': 'Tahlil & Statistika',
    'nav.settings': 'Sozlamalar',
    'nav.sign_out': 'Chiqish',
    'nav.connected': 'Ulandi',
    'nav.live': 'JONLI',
    'nav.section.core': 'Asosiy',
    'nav.section.kitchen': 'Oshxona & Buyurtmalar',
    'nav.section.omnichannel': 'Veb & AI Vositalar',
    'nav.section.growth': 'Mijozlar & Tahlil',

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
    'action.undo': 'Orqaga qaytarish',
    'action.redo': 'Oldinga qaytarish',
    'action.publish': 'Chop etish',
    'action.preview': 'Koʻrib chiqish',

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

    // Metrics
    'metric.revenue': 'Daromad',
    'metric.orders': 'Buyurtmalar',
    'metric.aov': 'Oʻrtacha chek',
    'metric.prep_time': 'Tayyorlash vaqti',
    'metric.repeat_rate': 'Doimiy mijozlar',
    'metric.top_items': 'Ommabop taomlar',
    'metric.today': 'Bugun',
    'metric.yesterday': 'Kecha',
    'metric.vs_yesterday': 'Kechagiga nisbatan',

    // KDS
    'kds.all': 'Barcha buyurtmalar',
    'kds.rush_only': 'Faqat shoshilinch',
    'kds.sound_on': 'Ovoz yoqilgan',
    'kds.sound_off': 'Ovoz oʻchirilgan',
    'kds.bump': 'Tayyor',
    'kds.recall': 'Qaytarish',
    'kds.order_count': 'ta buyurtma',

    // Settings
    'settings.general': 'Umumiy sozlamalar',
    'settings.branches': 'Filiallar',
    'settings.staff': 'Xodimlar & Ruxsatlar',
    'settings.notifications': 'Bildirishnomalar',
    'settings.integrations': 'Integratsiyalar',
  },

  ru: {
    // Navigation
    'nav.dashboard': 'Панель управления',
    'nav.website': 'Конструктор сайта',
    'nav.agents': 'ИИ Агенты',
    'nav.voice': 'Голосовые звонки',
    'nav.kds': 'Кухонный экран',
    'nav.menu': 'Меню',
    'nav.orders': 'Заказы',
    'nav.reservations': 'Бронирования',
    'nav.dispatch': 'Доставка',
    'nav.customers': 'Клиенты CRM',
    'nav.marketing': 'Маркетинг',
    'nav.analytics': 'Аналитика',
    'nav.settings': 'Настройки',
    'nav.sign_out': 'Выйти',
    'nav.connected': 'Подключено',
    'nav.live': 'LIVE',
    'nav.section.core': 'Главное',
    'nav.section.kitchen': 'Кухня и заказы',
    'nav.section.omnichannel': 'Сайт и ИИ',
    'nav.section.growth': 'Клиенты и аналитика',

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
    'action.undo': 'Отменить',
    'action.redo': 'Повторить',
    'action.publish': 'Опубликовать',
    'action.preview': 'Предпросмотр',

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

    // Metrics
    'metric.revenue': 'Выручка',
    'metric.orders': 'Заказы',
    'metric.aov': 'Средний чек',
    'metric.prep_time': 'Время готовки',
    'metric.repeat_rate': 'Повторные заказы',
    'metric.top_items': 'Популярные блюда',
    'metric.today': 'Сегодня',
    'metric.yesterday': 'Вчера',
    'metric.vs_yesterday': 'По сравнению со вчера',

    // KDS
    'kds.all': 'Все заказы',
    'kds.rush_only': 'Только срочные',
    'kds.sound_on': 'Звук включен',
    'kds.sound_off': 'Звук выключен',
    'kds.bump': 'Готово',
    'kds.recall': 'Вернуть',
    'kds.order_count': 'заказов',

    // Settings
    'settings.general': 'Общие настройки',
    'settings.branches': 'Филиалы',
    'settings.staff': 'Сотрудники и роли',
    'settings.notifications': 'Уведомления',
    'settings.integrations': 'Интеграции',
  },

  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.website': 'Website Studio',
    'nav.agents': 'AI Agents',
    'nav.voice': 'Voice Telephony',
    'nav.kds': 'Kitchen Display',
    'nav.menu': 'Menu Management',
    'nav.orders': 'Order History',
    'nav.reservations': 'Reservations',
    'nav.dispatch': 'Fleet Dispatch',
    'nav.customers': 'Customers CRM',
    'nav.marketing': 'Marketing Hub',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    'nav.sign_out': 'Sign Out',
    'nav.connected': 'Connected',
    'nav.live': 'LIVE',
    'nav.section.core': 'Overview',
    'nav.section.kitchen': 'Kitchen & Operations',
    'nav.section.omnichannel': 'Omnichannel & AI',
    'nav.section.growth': 'Growth & CRM',

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
    'action.undo': 'Undo',
    'action.redo': 'Redo',
    'action.publish': 'Publish',
    'action.preview': 'Preview',

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

    // Metrics
    'metric.revenue': 'Revenue',
    'metric.orders': 'Orders',
    'metric.aov': 'Average Order Value',
    'metric.prep_time': 'Prep Time',
    'metric.repeat_rate': 'Repeat Rate',
    'metric.top_items': 'Top Dishes',
    'metric.today': 'Today',
    'metric.yesterday': 'Yesterday',
    'metric.vs_yesterday': 'vs. yesterday',

    // KDS
    'kds.all': 'All Orders',
    'kds.rush_only': 'Rush Only',
    'kds.sound_on': 'Audio On',
    'kds.sound_off': 'Audio Off',
    'kds.bump': 'Bump Ready',
    'kds.recall': 'Recall',
    'kds.order_count': 'active orders',

    // Settings
    'settings.general': 'General Settings',
    'settings.branches': 'Branch Locations',
    'settings.staff': 'Staff & Access',
    'settings.notifications': 'Notifications',
    'settings.integrations': 'Integrations & API',
  },
};
