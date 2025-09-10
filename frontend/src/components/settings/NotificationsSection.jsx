import React from 'react';

const NotificationsSection = () => (
    <div id="notifications" className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-primary-1 rounded-full"></div>
            <h2 className="text-xl font-semibold text-neutrals-1">Notifications</h2>
        </div>
        <div className="space-y-4">
            {[
                { title: 'Email notifications', desc: 'Receive email updates about your bookings' },
                { title: 'Push notifications', desc: 'Get notified about new experiences and updates' },
                { title: 'Marketing emails', desc: 'Receive promotional content and travel tips' },
                { title: 'SMS notifications', desc: 'Get important updates via text message' }
            ].map((setting, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-neutrals-6 last:border-b-0">
                    <div>
                        <h3 className="font-medium text-neutrals-1">{setting.title}</h3>
                        <p className="text-sm text-neutrals-4">{setting.desc}</p>
                    </div>
                    <label className="toggle-button">
                        <input
                            type="checkbox"
                            className="toggle-input"
                            defaultChecked={index < 2}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            ))}
        </div>
    </div>
);

export default NotificationsSection;
