import { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  Trash2,
  Calendar,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import {
  getAllContacts,
  deleteContact,
  archiveContact,
  unarchiveContact,
} from "../../services/contactService";
import { Contact } from "../../types";
import { AdminFeedback } from "./AdminFeedback";

type FeedbackState = {
  message: string;
  variant: "success" | "error" | "info";
} | null;

export default function ContactManagement() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewArchived, setViewArchived] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  useEffect(() => {
    loadContacts();
  }, [viewArchived]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await getAllContacts({ archived: viewArchived });
      setContacts(data);
    } catch (error) {
      console.error("Error loading contacts:", error);
      setFeedback({
        message: "Неуспешно зареждане на съобщенията. Опитайте отново.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (confirm("Delete this contact?")) {
      const previousContacts = contacts;
      setContacts((prev) => prev.filter((contact) => contact.id !== id));
      try {
        await deleteContact(id);
        setFeedback({
          message: "Съобщението беше изтрито.",
          variant: "success",
        });
      } catch (error) {
        console.error("Error deleting contact:", error);
        setContacts(previousContacts);
        setFeedback({
          message: "Неуспешно изтриване на съобщението.",
          variant: "error",
        });
      }
    }
  };

  const handleArchiveToggle = async (contact: Contact) => {
    if (!contact.id) return;
    const previousContacts = contacts;
    setContacts((prev) =>
      prev.map((item) =>
        item.id === contact.id
          ? {
              ...item,
              archived: !contact.archived,
              archived_at: contact.archived ? null : new Date().toISOString(),
            }
          : item,
      ),
    );
    try {
      if (contact.archived) {
        await unarchiveContact(contact.id);
        setFeedback({
          message: "Съобщението беше върнато в активни.",
          variant: "success",
        });
      } else {
        await archiveContact(contact.id);
        setFeedback({
          message: "Съобщението беше архивирано.",
          variant: "success",
        });
      }
    } catch (error) {
      console.error("Error updating contact archive state:", error);
      setContacts(previousContacts);
      setFeedback({
        message: "Неуспешно обновяване на състоянието на съобщението.",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <AdminFeedback
          message={feedback.message}
          variant={feedback.variant}
          onDismiss={() => setFeedback(null)}
          autoHideMs={6000}
        />
      )}
      <div>
        <h2 className="text-2xl font-semibold text-boho-brown boho-heading">
          Контактни Съобщения
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-boho-rust font-boho">
            Съобщения от контактната форма
          </p>
          <button
            onClick={() => setViewArchived((prev) => !prev)}
            className={`ever-chip transition-colors ${viewArchived ? "bg-boho-terracotta text-white" : "bg-boho-cream text-boho-brown"}`}
          >
            {viewArchived ? "Показване на активни" : "Показване на архивирани"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-boho-rust font-boho">
          Зареждане на контакти...
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 text-boho-rust font-boho">
          Няма {viewArchived ? "архивирани" : "нови"} контактни заявки
        </div>
      ) : (
        <div className="grid gap-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-boho-cream bg-opacity-40 border-2 border-boho-brown border-opacity-20 rounded-boho p-6 hover:shadow-lg transition-all hover:border-opacity-40"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-boho-brown mb-2 font-boho">
                    {contact.name}
                  </h3>
                  <div className="text-sm text-boho-rust space-y-1 font-boho">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <a
                        href={`mailto:${contact.email}`}
                        className="hover:text-boho-sage"
                      >
                        {contact.email}
                      </a>
                    </div>
                    {contact.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {contact.created_at
                          ? new Date(contact.created_at).toLocaleString()
                          : "Неизвестно време"}
                      </span>
                    </div>
                    {contact.archived && contact.archived_at && (
                      <div className="flex items-center space-x-2 text-xs text-boho-rust/80">
                        <Archive className="w-4 h-4" />
                        <span>
                          Архивирано:{" "}
                          {new Date(contact.archived_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleArchiveToggle(contact)}
                    className="p-2 text-boho-brown hover:bg-boho-brown/10 rounded-boho transition-all"
                  >
                    {contact.archived ? (
                      <ArchiveRestore className="w-5 h-5" />
                    ) : (
                      <Archive className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="p-2 text-boho-terracotta hover:bg-boho-terracotta hover:bg-opacity-20 rounded-boho transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="bg-boho-warm bg-opacity-20 rounded-boho p-4">
                <div className="text-sm font-medium text-boho-brown mb-1 font-boho">
                  Съобщение:
                </div>
                <p className="text-sm text-boho-brown whitespace-pre-wrap font-boho">
                  {contact.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
