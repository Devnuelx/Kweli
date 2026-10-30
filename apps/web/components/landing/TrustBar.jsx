import React from 'react';

const TrustBar = () => {
  return (
    <div className="bg-gray-100 py-3 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center items-center gap-4 text-sm font-medium text-gray-600">
          <span className="flex items-center"><span className="text-blue-500 mr-2">✦</span> Built on Hedera Hashgraph</span>
          <span className="hidden sm:inline text-gray-300">·</span>
          <span className="flex items-center"><span className="text-blue-500 mr-2">✦</span> Immutable On-chain Records</span>
          <span className="hidden sm:inline text-gray-300">·</span>
          <span className="flex items-center"><span className="text-blue-500 mr-2">✦</span> Used by Brands Across Africa</span>
        </div>
      </div>
    </div>
  );
};

export default TrustBar;
