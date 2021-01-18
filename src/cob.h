#pragma once
#ifndef __COB_H__
#define __COB_H__

#include <memory>
#include <ostream>
#include <string>

class TACOBFile
{

public:
  TACOBFile(const std::string&);
  ~TACOBFile();

  void ExportToPython(std::ostream&);

private:
  class impl;
  std::unique_ptr<impl> _pimpl;
};



#endif