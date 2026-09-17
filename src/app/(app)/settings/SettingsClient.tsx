'use client';

import { useState, useTransition } from 'react';
import { updateSettings } from '@/app/actions/settingsActions';
import { changePassword } from '@/app/actions/userActions';
import styles from '../shared.module.css';

export default function SettingsClient({ initialSettings }: { initialSettings: any }) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState({ text: '', error: false });
  const [activeTab, setActiveTab] = useState('Restaurant Info');
  const [pwPending, startPwTransition] = useTransition();
  const [pwMsg, setPwMsg] = useState({ text: '', error: false });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg({ text: '', error: false });
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateSettings(formData);
      if (res?.error) {
        setMsg({ text: res.error, error: true });
      } else if (res?.success) {
        setMsg({ text: 'Settings saved successfully!', error: false });
        setTimeout(() => setMsg({ text: '', error: false }), 3000);
      }
    });
  };

  const handleChangePassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwMsg({ text: '', error: false });
    const formData = new FormData(e.currentTarget);
    startPwTransition(async () => {
      const res = await changePassword(formData);
      if (res?.error) {
        setPwMsg({ text: res.error, error: true });
      } else if (res?.success) {
        setPwMsg({ text: 'Password changed successfully!', error: false });
        (e.target as HTMLFormElement).reset();
        setTimeout(() => setPwMsg({ text: '', error: false }), 4000);
      }
    });
  };

  const tabs = ['Restaurant Info', 'Tax & Billing', 'Printing', 'Notifications', 'Security'];

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSubtitle}>Manage your restaurant configuration</p>
          {msg.text && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: msg.error ? '#ef4444' : '#10b981' }}>
              {msg.text}
            </div>
          )}
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btnSecondary} onClick={() => window.location.reload()}>Discard</button>
          <button type="submit" className={styles.btnPrimary} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className={styles.settingsLayout}>
        <div className={styles.settingsSidebar}>
          <div className={styles.settingsNav}>
            {tabs.map((label, i) => (
              <a
                key={i}
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab(label); }}
                className={`${styles.settingsNavItem} ${activeTab === label ? styles.active : ''}`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        <div>
          {/* RESTAURANT INFO */}
          <div style={{ display: activeTab === 'Restaurant Info' ? 'block' : 'none' }}>
            <div className={`${styles.card} ${styles.mb4}`}>
              <div className={styles.cardHeader}><span className={styles.cardTitle}>Restaurant Information</span></div>
              <div className={styles.cardBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Restaurant Name</label>
                    <input name="restaurantName" className={styles.formInput} defaultValue={initialSettings?.restaurantName || "Table Valley"} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Phone Number</label>
                    <input name="phone" className={styles.formInput} defaultValue={initialSettings?.phone || "+91 98765 43210"} required />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Address</label>
                  <input name="address" className={styles.formInput} defaultValue={initialSettings?.address || "12, MG Road, Bangalore, Karnataka – 560001"} required />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>GSTIN</label>
                    <input name="gstin" className={styles.formInput} defaultValue={initialSettings?.gstin || ""} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>FSSAI License</label>
                    <input name="fssaiLicense" className={styles.formInput} defaultValue={initialSettings?.fssaiLicense || ""} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TAX & BILLING */}
          <div style={{ display: activeTab === 'Tax & Billing' ? 'block' : 'none' }}>
            <div className={`${styles.card} ${styles.mb4}`}>
              <div className={styles.cardHeader}><span className={styles.cardTitle}>Tax & Billing</span></div>
              <div className={styles.cardBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>GST Rate (%)</label>
                    <input name="taxRate" className={styles.formInput} defaultValue={initialSettings?.taxRate ?? 5} type="number" step="0.01" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Service Charge (%)</label>
                    <input name="serviceCharge" className={styles.formInput} defaultValue={initialSettings?.serviceCharge ?? 0} type="number" step="0.01" />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Currency Symbol</label>
                  <input name="currencySymbol" className={styles.formInput} defaultValue={initialSettings?.currencySymbol || "₹"} style={{maxWidth:'120px'}} required />
                </div>
              </div>
            </div>
          </div>

          {/* PRINTING */}
          <div style={{ display: activeTab === 'Printing' ? 'block' : 'none' }}>
            <div className={styles.card}>
              <div className={styles.cardHeader}><span className={styles.cardTitle}>Printing Preferences</span></div>
              <div className={styles.cardBody}>
                <div className={styles.settingRow}>
                  <div>
                    <div className={styles.settingRowLabel}>Auto-print Bill</div>
                    <div className={styles.settingRowDesc}>Auto-print bill after payment confirmation</div>
                  </div>
                  <label className={styles.toggle}>
                    <input name="autoPrintBill" type="checkbox" defaultChecked={initialSettings?.autoPrintBill ?? false} />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* NOTIFICATIONS */}
          <div style={{ display: activeTab === 'Notifications' ? 'block' : 'none' }}>
            <div className={styles.card}>
              <div className={styles.cardHeader}><span className={styles.cardTitle}>Notification Preferences</span></div>
              <div className={styles.cardBody}>
                <div className={styles.settingRow}>
                  <div>
                    <div className={styles.settingRowLabel}>Sound Notifications</div>
                    <div className={styles.settingRowDesc}>Play a sound when a new order is received</div>
                  </div>
                  <label className={styles.toggle}>
                    <input name="soundNotifications" type="checkbox" defaultChecked={initialSettings?.soundNotifications ?? true} />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SECURITY & DISPLAY */}
          <div style={{ display: activeTab === 'Security' ? 'block' : 'none' }}>
            <div className={`${styles.card} ${styles.mb4}`}>
              <div className={styles.cardHeader}><span className={styles.cardTitle}>Display Preferences</span></div>
              <div className={styles.cardBody}>
                <div className={styles.settingRow}>
                  <div>
                    <div className={styles.settingRowLabel}>Dark Mode (Sidebar)</div>
                    <div className={styles.settingRowDesc}>Use dark sidebar across all POS terminals</div>
                  </div>
                  <label className={styles.toggle}>
                    <input name="darkModeSidebar" type="checkbox" defaultChecked={initialSettings?.darkModeSidebar ?? true} />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
                <div className={styles.settingRow}>
                  <div>
                    <div className={styles.settingRowLabel}>Show Item Images</div>
                    <div className={styles.settingRowDesc}>Display food emojis / images on product cards</div>
                  </div>
                  <label className={styles.toggle}>
                    <input name="showItemImages" type="checkbox" defaultChecked={initialSettings?.showItemImages ?? true} />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              </div>
            </div>

            {/* Change Password — separate form */}
            <form onSubmit={handleChangePassword}>
              <div className={styles.card}>
                <div className={styles.cardHeader}><span className={styles.cardTitle}>Change Password</span></div>
                <div className={styles.cardBody}>
                  {pwMsg.text && (
                    <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: pwMsg.error ? '#ef4444' : '#10b981', background: pwMsg.error ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${pwMsg.error ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, padding: '0.6rem 0.875rem', borderRadius: 8 }}>
                      {pwMsg.text}
                    </div>
                  )}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Current Password</label>
                    <input name="currentPassword" type="password" className={styles.formInput} placeholder="Enter current password" required />
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>New Password</label>
                      <input name="newPassword" type="password" className={styles.formInput} placeholder="Min. 6 characters" required minLength={6} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Confirm New Password</label>
                      <input name="confirmPassword" type="password" className={styles.formInput} placeholder="Repeat new password" required minLength={6} />
                    </div>
                  </div>
                  <button type="submit" className={styles.btnPrimary} disabled={pwPending} style={{ marginTop: '0.5rem' }}>
                    {pwPending ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </form>
  );
}
