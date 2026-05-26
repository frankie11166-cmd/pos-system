"use client";

import Link from "next/link";
import { useRef } from "react";

export function HistoryFilters({ action, date }: { action: string; date: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  function submit() {
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} className="panel search-panel" action="/history">
      <div className="form-grid">
        <div className="field">
          <label>Action</label>
          <select name="action" defaultValue={action} onChange={submit}>
            <option value="">All actions</option>
            <option value="STOCK_ADDED">Stock Added</option>
            <option value="SALE">Sale</option>
            <option value="RETURN">Return</option>
          </select>
        </div>
        <div className="field">
          <label>Date</label>
          <input name="date" type="date" defaultValue={date} onChange={submit} />
        </div>
      </div>
      {(action || date) && (
        <div className="button-row">
          <Link className="btn secondary" href="/history">
            Clear
          </Link>
        </div>
      )}
    </form>
  );
}
