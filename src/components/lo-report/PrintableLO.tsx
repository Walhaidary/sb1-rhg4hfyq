import React from 'react';
import type { LOReportData } from '../../types/lo-report';

interface PrintableLOProps {
  data: LOReportData[];
  onClose: () => void;
}

export function PrintableLO({ data, onClose }: PrintableLOProps) {
  // Group items by storage location
  const groupedItems = data.reduce<Record<string, LOReportData[]>>((acc, curr) => {
    const location = curr.storage_location_name;
    if (!acc[location]) {
      acc[location] = [];
    }
    acc[location].push(curr);
    return acc;
  }, {});

  // Print after component mounts
  React.useEffect(() => {
    window.print();
  }, []);

  return (
    <div className="p-8 bg-white min-h-screen print:p-0">
      {/* Print close button - hidden when printing */}
      <button 
        onClick={onClose}
        className="fixed top-4 right-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover print:hidden"
      >
        Close
      </button>

      {Object.entries(groupedItems).map(([location, items]) => (
        <div key={location} className="mb-8 print:mb-4 page-break-after-always">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Loading Order</h1>
            <p className="text-lg">LO Number: {items[0].outbound_delivery_number}</p>
            <p className="text-gray-600">
              Date: {new Date(items[0].loading_date).toLocaleDateString()}
            </p>
          </div>

          {/* Storage Location */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Storage Location</h2>
            <p>{location}</p>
          </div>

          {/* Driver Information */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Driver Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Name:</p>
                <p>{items[0].driver_name}</p>
              </div>
              <div>
                <p className="font-medium">Vehicle:</p>
                <p>{items[0].vehicle_plate}</p>
              </div>
              <div>
                <p className="font-medium">Transporter:</p>
                <p>{items[0].transporter_name}</p>
              </div>
              <div>
                <p className="font-medium">Destination:</p>
                <p>{items[0].destination}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Line No.</th>
                    <th className="border p-2 text-left">Gate No.</th>
                    <th className="border p-2 text-right font-arabic">Commodity</th>
                    <th className="border p-2 text-left">Batch No.</th>
                    <th className="border p-2 text-right">Quantity (MT)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.outbound_delivery_item_number}>
                      <td className="border p-2">{item.outbound_delivery_item_number}</td>
                      <td className="border p-2">{item.gate_number || '-'}</td>
                      <td className="border p-2 text-right font-arabic" dir="rtl">
                        {item.material_description}
                      </td>
                      <td className="border p-2">{item.batch_number || '-'}</td>
                      <td className="border p-2 text-right">{item.mt_net.toFixed(3)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-medium">
                    <td colSpan={4} className="border p-2 text-right">Total:</td>
                    <td className="border p-2 text-right">
                      {items.reduce((sum, item) => sum + item.mt_net, 0).toFixed(3)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <p className="font-medium mb-4">Driver Signature:</p>
              <div className="border-b border-gray-400 h-10"></div>
            </div>
            <div>
              <p className="font-medium mb-4">Warehouse Signature:</p>
              <div className="border-b border-gray-400 h-10"></div>
            </div>
            <div>
              <p className="font-medium mb-4">Security Signature:</p>
              <div className="border-b border-gray-400 h-10"></div>
            </div>
            <div>
              <p className="font-medium mb-4">Quality Signature:</p>
              <div className="border-b border-gray-400 h-10"></div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Notes</h2>
            <div className="border border-gray-300 rounded min-h-[100px] p-4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}