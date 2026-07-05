"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Modal from "./Modal";
import { useReschedule } from "@/lib/use-dashboard-data";

export default function RescheduleModal({ isOpen, onClose }) {
  const { result, loading, error, reschedule, reset } = useReschedule();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("16:00");
  const [userTimezone, setUserTimezone] = useState("");
  const [utcEquivalent, setUtcEquivalent] = useState("");

  useEffect(() => {
    setUserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  useEffect(() => {
    if (date && time) {
      try {
        const localDateTime = new Date(`${date}T${time}`);
        if (!isNaN(localDateTime.getTime())) {
          const utcDate = localDateTime.toISOString().split("T")[0];
          const utcTime = localDateTime.toISOString().split("T")[1].substring(0, 5);
          setUtcEquivalent(`${utcDate} at ${utcTime} UTC`);
        } else {
          setUtcEquivalent("");
        }
      } catch (e) {
        setUtcEquivalent("");
      }
    } else {
      setUtcEquivalent("");
    }
  }, [date, time]);

  const handleReschedule = () => {
    if (date && time) {
      try {
        const localDateTime = new Date(`${date}T${time}`);
        if (!isNaN(localDateTime.getTime())) {
          const utcDate = localDateTime.toISOString().split("T")[0];
          const utcTime = localDateTime.toISOString().split("T")[1].substring(0, 5);
          reschedule(date, time, utcDate, utcTime);
        }
      } catch (e) {
        // Fallback to sending what we have if Date parsing fails somehow
        reschedule(date, time);
      }
    }
  };

  const handleClose = () => {
    reset();
    setDate("");
    setTime("16:00");
    onClose();
  };

  // Quick date options
  const quickDates = [
    { label: "Tomorrow", offset: 1 },
    { label: "This Sunday", offset: (() => { const d = new Date(); return (7 - d.getDay()) || 7; })() },
    { label: "Next Week", offset: 7 },
  ];

  const setQuickDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setDate(d.toISOString().split("T")[0]);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reschedule Content" maxWidth="max-w-lg">
      {!result ? (
        <div className="space-y-6">
          {/* Info */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">
            <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-neutral-600">
              Based on analytics, <span className="text-blue-600 font-bold">Sunday 4:00 PM UTC</span> is your best performing slot.
            </p>
          </div>

          {/* Quick Pick */}
          <div>
            <label className="block text-sm font-bold text-[#0F0F0F] mb-3">Quick Pick</label>
            <div className="grid grid-cols-3 gap-2">
              {quickDates.map((qd) => (
                <button
                  key={qd.label}
                  onClick={() => setQuickDate(qd.offset)}
                  className="py-2.5 px-3 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-black/[0.04] rounded-xl text-sm font-medium transition-all text-[#374151] hover:text-[#0F0F0F]"
                >
                  {qd.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-sm font-bold text-[#0F0F0F] mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#F9FAFB] border border-black/[0.06] rounded-2xl text-[#0F0F0F] outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all [color-scheme:light]"
              />
            </div>
          </div>

          {/* Time Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-[#0F0F0F]">
                Time
              </label>
              {userTimezone && (
                <span className="text-xs text-neutral-400">{userTimezone}</span>
              )}
            </div>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#F9FAFB] border border-black/[0.06] rounded-2xl text-[#0F0F0F] outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all [color-scheme:light]"
              />
            </div>
          </div>

          {utcEquivalent && (
             <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-xl border border-blue-100 text-center font-medium">
               Will be published at: <strong>{utcEquivalent}</strong>
             </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleReschedule}
            disabled={loading || !date}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/30 disabled:cursor-not-allowed text-white rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Rescheduling...
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                Confirm Reschedule
              </>
            )}
          </button>
        </div>
      ) : (
        /* Success State */
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h4 className="text-lg font-bold text-[#0F0F0F]">Rescheduled Successfully!</h4>
          <p className="text-sm text-neutral-500">{result.message}</p>
          <button
            onClick={handleClose}
            className="mt-4 px-8 py-3 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-black/[0.04] rounded-2xl text-sm font-semibold transition-all text-[#374151]"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}
